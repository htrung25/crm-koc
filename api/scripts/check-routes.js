require('ts-node/register');

const { RequestMethod } = require('@nestjs/common');
const { PATH_METADATA, METHOD_METADATA } = require('@nestjs/common/constants');
const { NestFactory } = require('@nestjs/core');
const { pathToRegexp } = require('path-to-regexp');
const { AppModule } = require('../src/app.module');

const METHOD_NAME = {
  [RequestMethod.GET]: 'GET',
  [RequestMethod.POST]: 'POST',
  [RequestMethod.PUT]: 'PUT',
  [RequestMethod.DELETE]: 'DELETE',
  [RequestMethod.PATCH]: 'PATCH',
  [RequestMethod.ALL]: 'ALL',
  [RequestMethod.OPTIONS]: 'OPTIONS',
  [RequestMethod.HEAD]: 'HEAD',
};

function join(prefix, suffix) {
  const a = `/${prefix}`.replace(/\/+/g, '/').replace(/\/$/, '');
  const b = `/${suffix}`.replace(/\/+/g, '/').replace(/\/$/, '');
  return `${a}${b}` || '/';
}

async function collectRoutes() {
  const app = await NestFactory.create(AppModule, {
    preview: true,
    logger: false,
  });
  await app.init();

  const routes = [];
  for (const mod of app.container.getModules().values()) {
    for (const controller of mod.controllers.keys()) {
      const prefix = Reflect.getMetadata(PATH_METADATA, controller) ?? '';
      const proto = controller.prototype;
      // getOwnPropertyNames giữ đúng thứ tự khai báo method, cũng là thứ tự
      // Nest map route trong một controller.
      for (const key of Object.getOwnPropertyNames(proto)) {
        if (key === 'constructor') continue;
        const handler = proto[key];
        if (typeof handler !== 'function') continue;
        const suffix = Reflect.getMetadata(PATH_METADATA, handler);
        if (suffix === undefined) continue;
        const verb = Reflect.getMetadata(METHOD_METADATA, handler);
        routes.push({
          method: METHOD_NAME[verb] ?? String(verb),
          path: join(prefix, suffix),
          source: `${controller.name}.${key}`,
        });
      }
    }
  }

  await app.close();
  return routes;
}

function findShadowed(routes) {
  const problems = [];

  routes.forEach((route, index) => {
    // Chỉ route toàn literal mới bị nuốt; route có :param thì chính nó là kẻ nuốt.
    if (route.path.includes(':') || route.path.includes('*')) return;

    for (let i = 0; i < index; i++) {
      const earlier = routes[i];
      if (earlier.method !== route.method && earlier.method !== 'ALL') continue;
      if (!earlier.path.includes(':')) continue;

      const { regexp } = pathToRegexp(earlier.path);
      if (regexp.test(route.path)) {
        problems.push(
          `  ${route.method} ${route.path}\n` +
            `      bị nuốt bởi  ${earlier.method} ${earlier.path}  (${earlier.source})\n` +
            `      đăng ký ở #${i} < #${index} (${route.source})`,
        );
        break;
      }
    }
  });

  return problems;
}

async function main() {
  const routes = await collectRoutes();
  const problems = findShadowed(routes);

  if (problems.length) {
    console.error(
      `check-routes: ${problems.length} route bị route động đăng ký trước nuốt mất:\n`,
    );
    console.error(problems.join('\n\n'));
    console.error(
      '\nSửa bằng cách đổi thứ tự đăng ký (module trong app.module, controller\n' +
        'trong mảng controllers, hoặc method trong controller), hoặc đổi đường\n' +
        'dẫn để không còn va chạm. Express 5 KHÔNG hỗ trợ regex trong :param.',
    );
    process.exit(1);
  }

  console.log(
    `check-routes: ${routes.length} route, không có route nào bị nuốt.`,
  );
}

void main();
