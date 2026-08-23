import { BullHealthIndicator } from './bull.health';
import type { HealthIndicatorService } from '@nestjs/terminus';
import type { Queue } from 'bullmq';

function fakeIndicatorService() {
  const up = jest.fn().mockReturnValue({ bull: { status: 'up' } });
  const down = jest.fn().mockReturnValue({ bull: { status: 'down' } });
  return {
    service: {
      check: () => ({ up, down }),
    } as unknown as HealthIndicatorService,
    up,
    down,
  };
}

function fakeQueue(status: string, paused: boolean): Queue {
  return {
    name: 'email',
    client: Promise.resolve({ status }),
    isPaused: jest.fn().mockResolvedValue(paused),
  } as unknown as Queue;
}

describe('BullHealthIndicator', () => {
  it('lên xanh khi mọi queue ready và không paused', async () => {
    const { service, up } = fakeIndicatorService();
    const indicator = new BullHealthIndicator(service, [
      fakeQueue('ready', false),
    ]);
    await indicator.isHealthy('bull');
    expect(up).toHaveBeenCalled();
  });

  it('xuống đỏ khi queue bị paused — job nằm im mới là thứ cần bắt', async () => {
    const { service, down } = fakeIndicatorService();
    const indicator = new BullHealthIndicator(service, [
      fakeQueue('ready', true),
    ]);
    await indicator.isHealthy('bull');
    expect(down).toHaveBeenCalledWith(
      expect.objectContaining({ paused: ['email'] }),
    );
  });

  it('xuống đỏ khi kết nối ioredis chưa ready', async () => {
    const { service, down } = fakeIndicatorService();
    const indicator = new BullHealthIndicator(service, [
      fakeQueue('connecting', false),
    ]);
    await indicator.isHealthy('bull');
    expect(down).toHaveBeenCalledWith(
      expect.objectContaining({ notReady: ['email'] }),
    );
  });

  it('xuống đỏ khi queue.client treo mãi thay vì hang cả request', async () => {
    const { service, down } = fakeIndicatorService();
    const stuckQueue = {
      name: 'stuck',
      client: new Promise(() => {
        /* never settles — simulates ioredis wedged mid-reconnect */
      }),
      isPaused: jest.fn().mockResolvedValue(false),
    } as unknown as Queue;
    const indicator = new BullHealthIndicator(service, [stuckQueue], 20);

    await indicator.isHealthy('bull');

    expect(down).toHaveBeenCalledWith(
      expect.objectContaining({ timedOut: ['stuck'] }),
    );
  });
});
