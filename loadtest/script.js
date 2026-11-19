import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:3000";
const N = Number(__ENV.VUS || 40);
const RAMP_UP = __ENV.RAMP_UP || "2m30s";
const HOLD = __ENV.HOLD || "5m";
const RAMP_DOWN = __ENV.RAMP_DOWN || "2m";
const RUN_ID = __ENV.RUN_ID || String(Date.now());
const THINK = Number(__ENV.THINK || 1);

export const options = {
  scenarios: {
    read_heavy: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: RAMP_UP, target: N },
        { duration: HOLD, target: N },
        { duration: RAMP_DOWN, target: 0 },
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<1500"],
  },
  summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "p(99)", "max"],
};

const JSON_H = { "Content-Type": "application/json" };
let token = null; 
function ensureUser() {
  if (token) return true;
  const email = `k6-${RUN_ID}-vu${__VU}@loadtest.local`;
  const password = "secret12";
  let r = http.post(
    `${BASE}/auth/register`,
    JSON.stringify({ firstName: "Load", lastName: "Test", email, password, confirmPassword: password }),
    { headers: JSON_H, tags: { name: "POST /auth/register" } }
  );
  if (r.status === 409) {
    r = http.post(`${BASE}/auth/login`, JSON.stringify({ email, password }), {
      headers: JSON_H,
      tags: { name: "POST /auth/login" },
    });
  }
  if (r.status !== 201 && r.status !== 200) return false;
  token = r.json("token");
  return Boolean(token);
}

const authed = (name) => ({ headers: { ...JSON_H, Authorization: `Bearer ${token}` }, tags: { name } });
const rnd = (n) => 1 + Math.floor(Math.random() * n);
const pause = () => sleep((0.1 + Math.random() * 0.3) * THINK);

export default function () {
  if (!ensureUser()) {
    sleep(2);
    return;
  }

  const w = http.post(
    `${BASE}/orders`,
    JSON.stringify({
      firstName: "Load",
      lastName: "Test",
      email: "load@test.local",
      phone: "0500000000",
      address: "Lviv, Load st. 1",
      items: [{ id: `atom-${rnd(10)}`, name: "Item", variant: "Стабільний", quantity: rnd(3) }],
    }),
    authed("POST /orders")
  );
  check(w, { "order created (201)": (r) => r.status === 201 });
  const orderId = w.status === 201 ? w.json("data.id") : null;
  pause();

  const reads = [
    ["GET /atoms", `${BASE}/atoms`, false],
    ["GET /atoms/:id", `${BASE}/atoms/atom-${rnd(10)}`, false],
    ["GET /molecules", `${BASE}/molecules`, false],
    ["GET /molecules/:id", `${BASE}/molecules/mol-${rnd(10)}`, false],
    orderId ? ["GET /orders/:id", `${BASE}/orders/${orderId}`, true] : ["GET /atoms", `${BASE}/atoms`, false],
    ["GET /auth/me", `${BASE}/auth/me`, true], 
    ["GET /orders", `${BASE}/orders`, true],
    ["GET /atoms", `${BASE}/atoms?massMin=1&massMax=60`, false],
    ["GET /atoms/:id", `${BASE}/atoms/atom-${rnd(10)}`, false],
  ];
  for (const [name, url, needsAuth] of reads) {
    const r = http.get(url, needsAuth ? authed(name) : { tags: { name } });
    check(r, { [`${name} 200`]: (x) => x.status === 200 });
    pause();
  }

  sleep(0.5 * THINK);
}