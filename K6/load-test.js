import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '1m', target: 200 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
  },
};

export default function () {
  const response = http.get(
    'https://api.stg.crm-koc.duckdns.org/health/ready',
  );

  check(response, {
    'status is 200': (res) => res.status === 200,
    'response below 500ms': (res) => res.timings.duration < 500,
  });

  sleep(1);
}