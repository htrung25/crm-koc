// @ts-check
const { createHash } = require('node:crypto');

// Kiểm tra, đếm số lần thử và tiêu thụ thử thách trong một thao tác Redis duy nhất.
const VERIFY_OTP_BODY = `
if redis.call('GET', KEYS[2]) then return 'locked' end
local raw = redis.call('GET', KEYS[1])
if not raw then return 'expired' end
local ok, data = pcall(cjson.decode, raw)
if not ok or type(data) ~= 'table' or type(data.otp) ~= 'string' or type(data.attempts) ~= 'number' then
  redis.call('DEL', KEYS[1])
  return 'expired'
end
if data.otp == ARGV[1] then
  redis.call('DEL', KEYS[1], KEYS[3])
  return 'ok'
end
data.attempts = data.attempts + 1
if data.attempts >= tonumber(ARGV[2]) then
  redis.call('SET', KEYS[2], '1', 'EX', ARGV[3])
  redis.call('DEL', KEYS[1])
  return 'locked'
end
-- Wrong guesses must not extend the lifetime of the challenge.
redis.call('SET', KEYS[1], cjson.encode(data), 'KEEPTTL')
return 'invalid'
`;

const template = `#!lua name=crm_otp___VERSION__
redis.register_function('crm_otp___VERSION___verify', function(KEYS, ARGV)
${VERIFY_OTP_BODY}
end)
`;
const version = createHash('sha256')
  .update(template)
  .digest('hex')
  .slice(0, 16);
const functions = { verify: `crm_otp_${version}_verify` };
exports.OTP_FUNCTIONS = functions;
exports.OTP_LIBRARY = {
  name: `crm_otp_${version}`,
  code: template.replaceAll('__VERSION__', version),
  functions,
};
