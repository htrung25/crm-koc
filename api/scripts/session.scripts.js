// @ts-check
const { createHash } = require('node:crypto');

// Tất cả các thao tác phiên làm việc đều sử dụng cùng hai khóa và đọc giá trị mới nhất trong Redis.
const SESSION_COMMON = `
local p = cjson.decode(ARGV[1])
local clock = redis.call('TIME')
local now = tonumber(clock[1]) * 1000 + math.floor(tonumber(clock[2]) / 1000)

-- Existing sessions store ISO UTC dates. Accept that format during lazy migration.
local function millis(value)
  if type(value) ~= 'string' then return nil end
  local y,m,d,h,n,s,ms = string.match(value, '^(%d%d%d%d)%-(%d%d)%-(%d%d)T(%d%d):(%d%d):(%d%d)%.(%d%d%d)Z$')
  if not y then return nil end
  y,m,d,h,n,s,ms = tonumber(y),tonumber(m),tonumber(d),tonumber(h),tonumber(n),tonumber(s),tonumber(ms)
  local leap = y % 4 == 0 and (y % 100 ~= 0 or y % 400 == 0)
  local months = {31, leap and 29 or 28, 31,30,31,30,31,31,30,31,30,31}
  if m < 1 or m > 12 or d < 1 or d > months[m] or h > 23 or n > 59 or s > 59 then return nil end
  local prev = y - 1
  local days = 365 * prev + math.floor(prev/4) - math.floor(prev/100) + math.floor(prev/400) - 719162
  for i=1,m-1 do days = days + months[i] end
  return ((days+d-1)*86400+h*3600+n*60+s)*1000+ms
end
local function decode(raw, id)
  if not raw then return nil end
  local ok, v = pcall(cjson.decode, raw)
  if not ok or type(v) ~= 'table' or v.sessionId ~= id or v.adminId ~= p.accountId then return nil end
  local expires = millis(v.expiresAt)
  local created = millis(v.createdAt)
  -- Old sessions without absoluteExpiresAt are bounded by their existing expiry.
  local absolute = millis(v.absoluteExpiresAt or v.expiresAt)
  if not expires or not created or not absolute or expires <= now or absolute <= now then return nil end
  if type(v.currentJti) ~= 'string' then return nil end
  if v.deviceId ~= nil and (type(v.deviceId) ~= 'string' or v.deviceId == '') then return nil end
  v.absoluteExpiresAt = v.absoluteExpiresAt or v.expiresAt
  return v
end
local function remove(id, v)
  redis.call('HDEL', KEYS[1], id)
  if v and v.deviceId and redis.call('HGET', KEYS[2], v.deviceId) == id then
    redis.call('HDEL', KEYS[2], v.deviceId)
  end
end
local function load(id)
  local v = decode(redis.call('HGET', KEYS[1], id), id)
  if not v then return nil end
  if v.deviceId then
    local mapped = redis.call('HGET', KEYS[2], v.deviceId)
    if mapped and mapped ~= id then return nil end
  end
  return v
end
local function deadline(v)
  return math.min(millis(v.expiresAt), millis(v.absoluteExpiresAt or v.expiresAt))
end
local function index(v)
  if v.deviceId then
    redis.call('HSET', KEYS[2], v.deviceId, v.sessionId)
    redis.call('HPEXPIREAT', KEYS[2], deadline(v), 'FIELDS', 1, v.deviceId)
  end
end
local function save(v)
  redis.call('HSET', KEYS[1], v.sessionId, cjson.encode(v))
  redis.call('HPEXPIREAT', KEYS[1], deadline(v), 'FIELDS', 1, v.sessionId)
  index(v)
end
`;

const CREATE_SESSION_BODY = `
local incoming = p.session
if not decode(cjson.encode(incoming), incoming.sessionId) then return redis.error_reply('invalid new session') end
local all = redis.call('HGETALL', KEYS[1])
local live, devices, removed = {}, {}, {}
local function retire(id, reason, replacementId)
  if live[id] then
    table.insert(removed, {sessionId=id, reason=reason, replacedBy=replacementId or incoming.sessionId})
    live[id] = nil
  end
  redis.call('HDEL', KEYS[1], id)
end
for i=1,#all,2 do
  local id = all[i]
  local v = decode(all[i+1], id)
  if not v then
    redis.call('HDEL', KEYS[1], id)
  else
    live[id] = v
    if v.deviceId then
      local previous = devices[v.deviceId]
      if previous then
        local old = live[previous]
        if v.createdAt > old.createdAt or (v.createdAt == old.createdAt and id > previous) then
          retire(previous, 'duplicate_device', id)
          devices[v.deviceId] = id
        else
          retire(id, 'duplicate_device', previous)
        end
      else
        devices[v.deviceId] = id
      end
    end
  end
end
if incoming.deviceId and devices[incoming.deviceId] then
  retire(devices[incoming.deviceId], 'same_device_login')
end
live[incoming.sessionId] = incoming
local candidates = {}
for id,v in pairs(live) do
  if id ~= incoming.sessionId then table.insert(candidates, v) end
end
table.sort(candidates, function(a,b)
  local at = millis(a.lastSeenAt) or millis(a.createdAt)
  local bt = millis(b.lastSeenAt) or millis(b.createdAt)
  if at == bt then return a.sessionId < b.sessionId end
  return at < bt
end)
for i=1,#candidates+1-p.cap do retire(candidates[i].sessionId, 'device_limit') end
-- Rebuild the small index, including legacy sessions; stale fields cannot occupy slots.
redis.call('DEL', KEYS[2])
for id,v in pairs(live) do
  if id == incoming.sessionId then save(v) else
    redis.call('HPEXPIREAT', KEYS[1], deadline(v), 'FIELDS', 1, id)
    index(v)
  end
end
return cjson.encode({removed=removed})
`;

const READ_SESSION_BODY = `
local v = load(p.sessionId)
if not v then return false end
return cjson.encode(v)
`;

const UPDATE_SESSION_BODY = `
local v = load(p.sessionId)
if not v then return 'missing' end
if p.operation == 'attach' then
  if v.deviceId and v.deviceId ~= p.deviceId then return 'device_mismatch' end
  local mapped = redis.call('HGET', KEYS[2], p.deviceId)
  if mapped and mapped ~= p.sessionId and load(mapped) then return 'device_mismatch' end
  -- Legacy device-bound sessions may not have an index yet. Do not let a
  -- backfill steal their device; the user must authenticate a new login.
  local all = redis.call('HGETALL', KEYS[1])
  for i=1,#all,2 do
    local other = decode(all[i+1], all[i])
    if other and all[i] ~= p.sessionId and other.deviceId == p.deviceId then return 'device_mismatch' end
  end
  v.deviceId = p.deviceId
elseif p.operation == 'touch' or p.operation == 'rotate' then
  if p.operation == 'rotate' then
    if v.currentJti ~= p.expectedJti then return 'mismatch' end
    v.currentJti = p.newJti
  elseif now - (millis(v.lastSeenAt) or millis(v.createdAt)) < p.touchIntervalMs then
    return cjson.encode(v)
  end
  if not v.lastSeenAt or p.nowIso > v.lastSeenAt then v.lastSeenAt = p.nowIso end
  if p.expiresAt > v.expiresAt then v.expiresAt = p.expiresAt end
  if v.absoluteExpiresAt and v.expiresAt > v.absoluteExpiresAt then v.expiresAt = v.absoluteExpiresAt end
else
  return redis.error_reply('invalid session operation')
end
save(v)
return cjson.encode(v)
`;

const DELETE_SESSION_BODY = `
local raw = redis.call('HGET', KEYS[1], p.sessionId)
local v = decode(raw, p.sessionId)
remove(p.sessionId, v)
-- Also remove expired/malformed sessions' mappings, without touching a newer session.
local mappings = redis.call('HGETALL', KEYS[2])
for i=1,#mappings,2 do
  if mappings[i+1] == p.sessionId then redis.call('HDEL', KEYS[2], mappings[i]) end
end
return 1
`;

const DELETE_ACCOUNT_SESSIONS_BODY = `
local all = redis.call('HGETALL', KEYS[1])
local count = 0
local kept = nil
for i=1,#all,2 do
  local v = load(all[i])
  if v and all[i] == p.exceptSessionId then kept = v else
    if v then count = count + 1 end
    redis.call('HDEL', KEYS[1], all[i])
  end
end
redis.call('DEL', KEYS[2])
if kept then index(kept) end
return count
`;

// Callbacks receive keys/arguments explicitly; Functions have no global KEYS/ARGV.
const operations = {
  create: CREATE_SESSION_BODY,
  read: READ_SESSION_BODY,
  update: UPDATE_SESSION_BODY,
  delete: DELETE_SESSION_BODY,
  deleteAccount: DELETE_ACCOUNT_SESSIONS_BODY,
};
const context = `
local function session_context(KEYS, ARGV)
${SESSION_COMMON}
return p, now, decode, remove, load, deadline, index, save, millis
end
`;
const template =
  '#!lua name=crm_sessions___VERSION__\n' +
  context +
  Object.entries(operations)
    .map(
      ([operation, body]) => `
redis.register_function{
  function_name='crm_sessions___VERSION___${operation}',
  callback=function(KEYS, ARGV)
    local p, now, decode, remove, load, deadline, index, save, millis = session_context(KEYS, ARGV)
    ${body}
  end,
  flags={${operation === 'read' ? "'no-writes'" : ''}}
}
`,
    )
    .join('\n');
const version = createHash('sha256')
  .update(template)
  .digest('hex')
  .slice(0, 16);
const functions = Object.fromEntries(
  Object.keys(operations).map((operation) => [
    operation,
    `crm_sessions_${version}_${operation}`,
  ]),
);
exports.SESSION_FUNCTIONS = functions;
exports.SESSION_LIBRARY = {
  name: `crm_sessions_${version}`,
  code: template.replaceAll('__VERSION__', version),
  functions,
};
