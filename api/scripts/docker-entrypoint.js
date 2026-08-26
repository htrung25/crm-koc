const { spawn } = require('node:child_process');
const { connect } = require('node:net');
const { constants } = require('node:os');

const SIGNALS = ['SIGTERM', 'SIGINT', 'SIGHUP'];
const WAIT_TIMEOUT = Number(process.env.DB_WAIT_TIMEOUT || 60);

function dbTarget() {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return { host: url.hostname, port: Number(url.port || 5432) };
  }
  return {
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT || 5432),
  };
}

function waitForDb({ host, port }, timeoutSeconds) {
  const deadline = Date.now() + timeoutSeconds * 1000;

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = connect({ host, port });
      socket.setTimeout(2000);

      const retry = () => {
        socket.destroy();
        if (Date.now() > deadline) {
          reject(new Error(`khong ket noi duoc ${host}:${port}`));
          return;
        }
        setTimeout(attempt, 1000);
      };

      socket.once('connect', () => {
        socket.end();
        resolve();
      });
      socket.once('timeout', retry);
      socket.once('error', retry);
    };

    attempt();
  });
}

/**
 * `sh` thay luôn ảnh tiến trình nên app nhận tín hiệu trực tiếp; Node không làm
 * được thế, phải spawn rồi tự chuyển tiếp. Thiếu phần chuyển tiếp thì SIGTERM
 * dừng ở entrypoint, app không nhận được, và graceful drain (worker.close(),
 * enableShutdownHooks) thành vô nghĩa — container treo tới lúc ăn SIGKILL.
 */
function runToCompletion(command, args) {
  return new Promise((resolve, reject) => {
    // argv dạng mảng, không qua shell: tham số không bị tách từ hay diễn giải.
    const child = spawn(command, args, { stdio: 'inherit' });
    const listeners = SIGNALS.map((signal) => {
      const handler = () => child.kill(signal);
      process.on(signal, handler);
      return [signal, handler];
    });

    const cleanup = () => {
      for (const [signal, handler] of listeners) process.off(signal, handler);
    };

    child.once('error', (error) => {
      cleanup();
      reject(error);
    });
    child.once('exit', (code, signal) => {
      cleanup();
      // Chết vì tín hiệu thì trả 128+n theo quy ước shell, để Docker và CI đọc
      // đúng nguyên nhân thay vì thấy exit 0.
      resolve(signal ? 128 + constants.signals[signal] : (code ?? 0));
    });
  });
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0) {
    console.error('entrypoint: thieu lenh de chay');
    process.exit(2);
  }

  const target = dbTarget();
  console.log(
    `entrypoint: cho Postgres ${target.host}:${target.port} (toi da ${WAIT_TIMEOUT}s)...`,
  );
  try {
    await waitForDb(target, WAIT_TIMEOUT);
  } catch (error) {
    console.error(`entrypoint: ${error.message}`);
    process.exit(1);
  }
  console.log('entrypoint: Postgres san sang.');

  // Chỉ dev local mới bật. Staging/prod để trống hoặc false.
  if ((process.env.RUN_MIGRATIONS ?? 'false') === 'true') {
    const script = process.env.MIGRATION_SCRIPT || 'migration:run';
    console.log(`entrypoint: chay npm run ${script}`);
    const code = await runToCompletion('npm', ['run', script]);
    if (code !== 0) process.exit(code);
  }

  try {
    process.exit(await runToCompletion(argv[0], argv.slice(1)));
  } catch (error) {
    console.error(`entrypoint: khong chay duoc ${argv[0]}: ${error.message}`);
    process.exit(127);
  }
}

void main();
