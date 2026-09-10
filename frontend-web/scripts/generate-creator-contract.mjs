import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import {
  creatorPageSchema,
  creatorDetailSchema,
} from '../src/features/admin/kocs/creator-types.ts';

const query = (name, schema, description) => ({
  name,
  in: 'query',
  required: false,
  schema,
  description,
});
const responses = (schema) => ({
  200: {
    description:
      'Creator data; optional groups are absent until implemented by backend.',
    content: {
      'application/json': {
        schema: { $ref: `#/components/schemas/${schema}` },
      },
    },
  },
  ...Object.fromEntries(
    [400, 401, 403, 404, 502, 503].map((status) => [
      status,
      {
        description: {
          400: 'Invalid input',
          401: 'Unauthenticated',
          403: 'Forbidden',
          404: 'Creator not found',
          502: 'Invalid upstream response',
          503: 'Upstream unavailable',
        }[status],
      },
    ])
  ),
});
const spec = {
  openapi: '3.1.0',
  info: {
    title: 'Admin Creator read-only BFF',
    version: '1.0.0',
    description:
      'Current account-only API plus optional target profile contract. See domain-definitions.md and permissions.md for semantics and backend implementation gaps.',
  },
  security: [{ cookieSession: [] }],
  paths: {
    '/api/admin/creators': {
      get: {
        operationId: 'listAdminCreators',
        parameters: [
          query('page', { type: 'integer', minimum: 1, default: 1 }),
          query(
            'limit',
            { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            'Backend default 20; frontend sends 10'
          ),
          query('search', { type: 'string' }),
          query(
            'status',
            { type: 'integer', enum: [1, 2, 3, 4] },
            'Account status, never collaboration status'
          ),
          query('sortBy', {
            type: 'string',
            enum: ['createdAt', 'name', 'email', 'status'],
            default: 'createdAt',
          }),
          query('sortOrder', {
            type: 'string',
            enum: ['ASC', 'DESC'],
            default: 'DESC',
          }),
        ],
        responses: responses('CreatorPage'),
      },
    },
    '/api/admin/creators/{id}': {
      get: {
        operationId: 'getAdminCreator',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'accounts.id = creator_profiles.account_id',
          },
          query(
            'historyPage',
            { type: 'integer', minimum: 1, default: 1 },
            'Target backend extension; currently ignored upstream'
          ),
          query(
            'historyLimit',
            { type: 'integer', minimum: 1, maximum: 100, default: 10 },
            'Target backend extension; currently ignored upstream'
          ),
        ],
        responses: responses('CreatorDetail'),
      },
    },
  },
  components: {
    securitySchemes: {
      cookieSession: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token',
        description:
          'HttpOnly access cookie; backend validates JWT, role and IP. Refresh flow is separate.',
      },
    },
    schemas: {
      CreatorPage: z.toJSONSchema(creatorPageSchema),
      CreatorDetail: z.toJSONSchema(creatorDetailSchema),
    },
  },
};
const output = fileURLToPath(
  new URL('../contracts/creator-profile.openapi.json', import.meta.url)
);
const contents = `${JSON.stringify(spec, null, 2)}\n`;
if (process.argv.includes('--check')) {
  if (readFileSync(output, 'utf8') !== contents) {
    console.error('Creator contract is out of date: npm run contract:creator');
    process.exit(1);
  }
  console.log('Creator OpenAPI matches runtime schemas.');
} else {
  writeFileSync(output, contents);
  console.log('Wrote contracts/creator-profile.openapi.json');
}
