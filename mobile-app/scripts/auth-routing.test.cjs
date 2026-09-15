const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { test } = require('node:test');
const ts = require('typescript');

// Thực thi schema, API adapter và các route guard thật; chỉ thay native UI/HTTP.
const root = path.resolve(__dirname, '..');
let session = { status: 'unauthenticated', account: null };
let payload;
const Tabs = Object.assign(() => null, { Screen: 'TabScreen' });
const useSession = () => session;
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return resolve.call(
    this,
    request.startsWith('@/')
      ? path.join(root, 'src', request.slice(2))
      : request,
    ...args
  );
};
const load = Module._load;
Module._load = function (request, ...args) {
  if (request === 'expo-router')
    return { Redirect: 'Redirect', Stack: 'Stack' };
  if (request === 'expo-router/tabs') return { Tabs };
  if (request === 'expo-status-bar') return { StatusBar: 'StatusBar' };
  if (request === 'react-native') return { View: 'View' };
  if (request === 'react-i18next')
    return { useTranslation: () => ({ t: (key) => key }) };
  if (
    request === '@/features/auth' ||
    request === '@/features/auth/hooks/use-auth'
  )
    return { useSession, AccountGate: 'AccountGate' };
  if (request === '@/features/auth/components/account-screen')
    return { AccountScreen: 'AccountScreen' };
  if (request === '@/shared/ui')
    return { TabGlyph: 'TabGlyph', tabBarScreenOptions: {} };
  if (request === '@/shared/theme') return { brand: { paper: '#fff' } };
  if (request === '@/shared/api')
    return {
      apiClient: {
        get: async () => ({ data: payload }),
        post: async () => ({ data: payload }),
      },
    };
  return load.call(this, request, ...args);
};
for (const extension of ['.ts', '.tsx']) {
  Module._extensions[extension] = (module, filename) => {
    const { outputText } = ts.transpileModule(
      fs.readFileSync(filename, 'utf8'),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.ReactJSX,
          target: ts.ScriptTarget.ES2022,
          esModuleInterop: true,
        },
        fileName: filename,
      }
    );
    module._compile(outputText, filename);
  };
}

const { authApi } = require('@/features/auth/api/auth.api');
const { accountSchema } = require('@/features/auth/model/schemas');
const { RoleRedirect } = require('@/features/auth/components/role-redirect');
const BrandLayout = require('@/app/(app)/brand/_layout').default;
const CreatorLayout = require('@/app/(app)/creator/_layout').default;
const AppLayout = require('@/app/(app)/_layout').default;
const AuthLayout = require('@/app/(auth)/_layout').default;
const PublicLayout = require('@/app/(public)/_layout').default;
const account = (role) => ({
  id: 'test-account',
  email: 'test@example.com',
  name: 'Test',
  accountRole: role,
  status: 2,
});

for (const role of ['brand', 'creator']) {
  test(`OTP ${role} response opens its dashboard and blocks the other role's tabs`, async () => {
    payload = {
      accessToken: 'access',
      refreshToken: 'refresh',
      account: account(role),
    };
    const result = await authApi.verifyOtp({
      email: 'test@example.com',
      otp: '123456',
    });
    session = { status: 'authenticated', account: result.account };
    assert.equal(RoleRedirect().props.href, `/${role}`);
    assert.equal((role === 'brand' ? BrandLayout : CreatorLayout)().type, Tabs);
    assert.equal(
      (role === 'brand' ? CreatorLayout : BrandLayout)().props.href,
      '/dashboard'
    );
    assert.equal(AuthLayout().props.href, '/dashboard');
    assert.equal(PublicLayout().props.href, '/dashboard');
  });

  test(`restored ${role} account from /auth/me opens the same dashboard`, async () => {
    payload = { ...account(role), createdAt: '2026-09-12T00:00:00Z' };
    session = { status: 'authenticated', account: await authApi.me() };
    assert.equal(RoleRedirect().props.href, `/${role}`);
  });
}

test('guest cannot access the protected application', () => {
  session = { status: 'unauthenticated', account: null };
  assert.equal(AppLayout().props.href, '/login');
  assert.equal(AuthLayout().type, 'Stack');
});

test('admin and account without role do not enter brand/creator tabs', () => {
  for (const role of ['admin', null]) {
    session = { status: 'authenticated', account: account(role) };
    assert.equal(RoleRedirect().type, 'AccountScreen');
    assert.equal(BrandLayout().props.href, '/dashboard');
    assert.equal(CreatorLayout().props.href, '/dashboard');
  }
});

test('unknown/uppercase role and incorrect status are rejected instead of silently routing', () => {
  for (const role of ['BRAND', 'CREATOR', 'unknown']) {
    assert.equal(accountSchema.safeParse(account(role)).success, false);
  }
  assert.equal(
    accountSchema.safeParse({ ...account('brand'), status: 'ACTIVE' }).success,
    false
  );
  for (const status of [1, 2, 3, 4]) {
    assert.equal(
      accountSchema.safeParse({ ...account('brand'), status }).success,
      true
    );
  }
});

test('discover and entry modules are removed; entry routes use auth and creator routes use creator', () => {
  for (const feature of ['discover', 'entry']) {
    assert.equal(
      fs.existsSync(path.join(root, 'src/features', feature)),
      false
    );
  }
  for (const route of ['login', 'register', 'sign-in']) {
    assert.match(
      fs.readFileSync(path.join(root, `src/app/(auth)/${route}.tsx`), 'utf8'),
      /from '@\/features\/auth'/
    );
  }
  assert.match(
    fs.readFileSync(path.join(root, 'src/app/(app)/creator/index.tsx'), 'utf8'),
    /CreatorFeedScreen/
  );
});
