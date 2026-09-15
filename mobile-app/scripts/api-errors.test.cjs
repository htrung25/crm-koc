const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { test } = require('node:test');
const ts = require('typescript');
const axios = require('axios');

function loadSource(relative, dependencies = {}) {
  const filename = path.resolve(__dirname, '..', relative);
  const instance = new Module(filename, module);
  instance.filename = filename;
  instance.paths = module.paths;
  const originalRequire = instance.require.bind(instance);
  instance.require = (name) => dependencies[name] ?? originalRequire(name);
  instance._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
      fileName: filename,
    }).outputText,
    filename
  );
  return instance.exports;
}
const errors = loadSource('src/shared/api/errors.ts');
const { ApiError, toApiError } = errors;
const { FormError } = loadSource(
  'src/features/auth/components/form-error.tsx',
  {
    '@/shared/api': errors,
    '@/shared/ui': { Text: 'Text' },
  }
);
const responseError = (status, data) =>
  new axios.AxiosError('Request failed', undefined, undefined, undefined, {
    status,
    data,
  });

test('409 preserves HTTP status, business code, campaign status/version and unknown metadata', () => {
  const body = {
    statusCode: 409,
    businessCode: 7000,
    message: 'campaign was modified',
    status: 2,
    version: 8,
    path: '/campaigns/1',
    timestamp: '2026-09-12',
    extra: { current: true },
  };
  const error = toApiError(responseError(409, body));
  assert.equal(error.kind, 'conflict');
  assert.equal(error.status, 409);
  assert.equal(error.resourceStatus, 2);
  assert.equal(error.version, 8);
  assert.equal(error.businessCode, 7000);
  assert.deepEqual(error.payload, body);
  assert.equal(toApiError(error), error);
});

test('422 preserves field paths, issue codes and metadata, and form shows all messages once', () => {
  const issues = [
    {
      code: 'min',
      fieldPath: 'deliverables.0.quantity',
      message: 'Quantity too low',
      metadata: { min: 2 },
    },
    { code: 'required', fieldPath: 'title', message: 'Title required' },
  ];
  const error = toApiError(
    responseError(422, {
      businessCode: 7003,
      message: 'Campaign invalid',
      errors: issues,
    })
  );
  assert.equal(error.kind, 'validation');
  assert.deepEqual(error.errors, issues);
  assert.equal(
    FormError({ error }).props.children,
    'Campaign invalid\nQuantity too low\nTitle required'
  );
});

test('Nest message array remains available and is fully displayed without duplicates', () => {
  const error = toApiError(
    responseError(400, {
      message: ['Email invalid', 'Name required', 'Email invalid'],
    })
  );
  assert.deepEqual(error.details, [
    'Email invalid',
    'Name required',
    'Email invalid',
  ]);
  assert.equal(
    FormError({ error }).props.children,
    'Email invalid\nName required'
  );
});

test('403 keeps KYC business code; zero and string codes also survive', () => {
  for (const businessCode of [6002, 0, 'KYC_NOT_VERIFIED']) {
    const error = toApiError(
      responseError(403, { businessCode, message: 'KYC required' })
    );
    assert.equal(error.kind, 'forbidden');
    assert.equal(error.businessCode, businessCode);
  }
});

test('malformed response bodies never become object messages; original payload is retained', () => {
  for (const body of [
    null,
    undefined,
    '<html>Bad gateway</html>',
    [],
    { message: {} },
    { message: [null, 1, {}], error: {} },
  ]) {
    const error = toApiError(responseError(502, body));
    assert.equal(error.message, 'Yêu cầu thất bại (502).');
    assert.equal(error.kind, 'server');
    assert.deepEqual(error.payload, body);
  }
  const error = toApiError(
    responseError(422, {
      message: [null, '', 'Valid message'],
      errors: [null, { fieldPath: 'a' }],
      version: '8',
      status: {},
      businessCode: {},
    })
  );
  assert.equal(error.message, 'Valid message');
  assert.deepEqual(error.errors, []);
  assert.equal(error.version, null);
  assert.equal(error.resourceStatus, null);
  assert.equal(error.businessCode, null);
  assert.equal(error.payload.errors.length, 2);
});

test('error title fallback, network and unexpected failures remain usable', () => {
  assert.equal(
    toApiError(responseError(404, { message: '', error: 'Not Found' })).message,
    'Not Found'
  );
  const network = toApiError(new axios.AxiosError('timeout', 'ECONNABORTED'));
  assert.equal(network.kind, 'network');
  assert.equal(network.status, null);
  assert.equal(toApiError(new Error('Unexpected')).message, 'Unexpected');
  assert.equal(FormError({ error: null }), null);
  assert.equal(FormError({ error: {} }).props.children, 'Đã có lỗi xảy ra.');
  assert.ok(network instanceof ApiError);
});
