import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// ==============================================================================
// 1. CUSTOM METRICS (Theo dõi chi tiết điểm gãy & độ trễ)
// ==============================================================================
const latencyTrend = new Trend('custom_waiting_time');
const errorRate = new Rate('custom_error_rate');
const successfulReqs = new Counter('custom_successful_requests');
const failedReqs = new Counter('custom_failed_requests');

// ==============================================================================
// 2. BREAKPOINT / STRESS TEST STAGES (Tăng tải bậc thang tìm giới hạn chịu tải)
// ==============================================================================
export const options = {
  // Ramping VUs: Tăng dần từ 50 lên 1000 Virtual Users
  stages: [
    { duration: '30s', target: 50 },   // 1. Warm-up & Baseline: 50 VUs
    { duration: '1m',  target: 100 },  // 2. Tải trung bình: 100 VUs
    { duration: '1m',  target: 150 },  // 3. Tải cao: 250 VUs
    { duration: '1m',  target: 350 },  // 4. Stress Test: 500 VUs
    { duration: '1m',  target: 500 },  // 5. Heavy Stress: 750 VUs
    { duration: '1m',  target: 1000 }, // 6. Breakpoint Limit: 1000 VUs
    { duration: '1m',  target: 1000 }, // 7. Duy trì ở đỉnh 1000 VUs
    { duration: '1m',  target: 0 },    // 8. Cooldown / Recovery: Hạ về 0 đo tốc độ hồi phục
  ],

  // Ngưỡng tiêu chuẩn: Đánh dấu cảnh báo khi bắt đầu vượt ngưỡng
  thresholds: {
    http_req_failed: [
      {
        threshold: 'rate<0.05', // Tỉ lệ lỗi tổng thể dưới 5%
        abortOnFail: false,     // Không tự ngắt ngang để xem biểu đồ gãy ở đâu
      },
    ],
    http_req_duration: [
      'p(90)<500',   // 90% requests dưới 500ms
      'p(95)<1000',  // 95% requests dưới 1s
      'p(99)<2000',  // 99% requests dưới 2s (nếu vượt ngưỡng này tức là server bắt đầu nghẽn)
    ],
  },
};

// ==============================================================================
// 3. CẤU HÌNH MÔI TRƯỜNG & TARGET ENDPOINT
// ==============================================================================
const BASE_URL = __ENV.TARGET_URL || 'https://api.staging.crm-koc.duckdns.org';
const ENDPOINT_PATH = __ENV.ENDPOINT_PATH || '/health'; // Hoặc endpoint bạn muốn test (vd: /health, /api/auth/..., /admin/...)
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

export default function () {
  const url = `${BASE_URL}${ENDPOINT_PATH}`;

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
    },
    timeout: '10s', // Timeout sau 10 giây nếu server bị treo
  };

  const response = http.get(url, params);

  // Ghi nhận metrics
  latencyTrend.add(response.timings.waiting);

  const isSuccess = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  if (isSuccess) {
    successfulReqs.add(1);
    errorRate.add(0);
  } else {
    failedReqs.add(1);
    errorRate.add(1);
  }

  // Think time ngẫu nhiên (100ms - 300ms) mô phỏng người dùng thực tế
  sleep(Math.random() * 0.2 + 0.1);
}

// ==============================================================================
// 4. XUẤT BÁO CÁO HTML TRỰC QUAN (report.html)
// ==============================================================================
export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data, null, 2),
    'report.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
