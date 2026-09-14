import type { RedisClientType } from 'redis';
import { OTP_LIBRARY } from '../../scripts/otp.scripts.js';
import { SESSION_LIBRARY } from '../../scripts/session.scripts.js';

interface FunctionLibrary {
  name: string;
  code: string;
  functions: Record<string, string>;
}

const libraries: FunctionLibrary[] = [OTP_LIBRARY, SESSION_LIBRARY];
const loading = new WeakMap<RedisClientType, Promise<void>>();

/** Names contain a content hash: an old API cannot overwrite a newer library. */
async function loadLibrary(
  client: RedisClientType,
  library: FunctionLibrary,
): Promise<void> {
  try {
    await client.functionLoad(library.code);
  } catch (error) {
    if (
      !(error instanceof Error) ||
      error.message !== `ERR Library '${library.name}' already exists`
    )
      throw error;
    // Another API/worker may have loaded the same version concurrently.
    const installed = await client.functionList({ LIBRARYNAME: library.name });
    const names = new Set(
      installed.flatMap((item) => item.functions.map((fn) => fn.name)),
    );
    if (!Object.values(library.functions).every((name) => names.has(name)))
      throw error;
  }
}

/** Await this before exposing the Redis provider to API/worker consumers. */
export function loadAuthRedisFunctions(client: RedisClientType): Promise<void> {
  const pending = loading.get(client);
  if (pending) return pending;
  const task = (async () => {
    for (const library of libraries) await loadLibrary(client, library);
  })();
  loading.set(client, task);
  return task.finally(() => {
    if (loading.get(client) === task) loading.delete(client);
  });
}

export async function callAuthRedisFunction(
  client: RedisClientType,
  functionName: string,
  options: { keys: string[]; arguments: string[] },
) {
  if (
    !libraries.some((library) =>
      Object.values(library.functions).includes(functionName),
    )
  ) {
    throw new Error('Unknown auth Redis function');
  }
  try {
    return await client.fCall(functionName, options);
  } catch (error) {
    // Retry only when Redis has not executed the function. Network/ACL/runtime
    // errors must never replay a possibly successful mutation or OTP consume.
    if (!(error instanceof Error) || error.message !== 'ERR Function not found')
      throw error;
    await loadAuthRedisFunctions(client);
    return client.fCall(functionName, options);
  }
}
