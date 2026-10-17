// Password sign-in limits (apps/api/src/http/login-throttle.ts) and the known-browser cookie
// (admin/auth.ts), without the database. Failure cases: a stranger's wrong passwords lock the admin's own
// browser out, a correct password uses up the budget, one IPv6 subscriber escapes the network budget by
// changing addresses, flooding the table forgets an active budget, another signed value passes as a
// known browser.
import assert from "node:assert/strict";
import { test } from "node:test";
import { DEVICE_COOKIE, deviceToken, knownDevice, loginRedirect } from "@hotmoto/backend/admin/auth";
import { LIMITS, LoginThrottle, networkOf } from "../apps/api/src/http/login-throttle.ts";

process.env.SESSION_SECRET ??= "login-throttle-test-secret-0123456789";

function clock() {
  let now = Date.UTC(2026, 9, 17, 12);
  return { now: () => now, advance: (ms: number) => { now += ms; } };
}

test("IPv4 addresses count alone, an IPv6 address counts by its /64", () => {
  assert.equal(networkOf("203.0.113.7"), "203.0.113.7");
  assert.equal(networkOf("::ffff:203.0.113.7"), "203.0.113.7");
  assert.equal(networkOf("2001:db8:1:2:aaaa::1"), "2001:db8:1:2::/64");
  assert.equal(networkOf("2001:0db8:0001:0002:ffff:ffff:ffff:ffff"), "2001:db8:1:2::/64");
  assert.equal(networkOf("2001:db8::1"), "2001:db8:0:0::/64");
  assert.equal(networkOf("::1"), "0:0:0:0::/64");
});

test("a stranger's wrong passwords never lock out a browser that signed in before", () => {
  const c = clock();
  const t = new LoginThrottle(c.now);
  for (let i = 0; i < LIMITS.shared; i++) t.fail(`198.51.100.${i}`, null);
  assert.equal(t.blocked("192.0.2.1", null), true, "the shared budget stops guesses spread over many addresses");
  assert.equal(t.blocked("192.0.2.1", "admin-browser"), false);
  c.advance(15 * 60_000);
  assert.equal(t.blocked("192.0.2.1", null), false, "wrong passwords count for 15 minutes");
});

test("each budget holds for its own attempts: a network, a known browser", () => {
  const t = new LoginThrottle(clock().now);
  for (let i = 0; i < LIMITS.network; i++) t.fail(`2001:db8:1:2::${i + 1}`, null);
  assert.equal(t.blocked("2001:db8:1:2:ffff::9", null), true, "another address in the same /64");
  assert.equal(t.blocked("2001:db8:1:3::1", null), false);
  for (let i = 0; i < LIMITS.device; i++) t.fail("192.0.2.1", "stolen-browser");
  assert.equal(t.blocked("192.0.2.1", "stolen-browser"), true);
  assert.equal(t.blocked("192.0.2.1", "admin-browser"), false);
  // A known browser's own mistakes do not use up anyone else's budget.
  assert.equal(t.blocked("192.0.2.1", null), false);
});

test("flooding with addresses neither resets a network's budget nor grows the table past the shared budget", () => {
  const t = new LoginThrottle(clock().now);
  for (let i = 0; i < LIMITS.network; i++) t.fail("192.0.2.1", null);
  // As the sign-in route does: a blocked attempt is not tried, so it is not counted.
  let tried = 0;
  for (let i = 0; i < 6000; i++) {
    const ip = `2001:db8:${(i >> 8).toString(16)}:${(i & 0xff).toString(16)}::1`;
    if (t.blocked(ip, null)) continue;
    tried++;
    t.fail(ip, null);
  }
  assert.equal(tried, LIMITS.shared - LIMITS.network);
  assert.equal(t.blocked("192.0.2.1", null), true);
});

test("only a signed device value from this site names a known browser", () => {
  const issued = deviceToken();
  const id = knownDevice(`${DEVICE_COOKIE}=${encodeURIComponent(issued)}`);
  assert.ok(id && id.length >= 16);
  assert.equal(knownDevice(`${DEVICE_COOKIE}=${encodeURIComponent(deviceToken(id))}`), id, "renewing keeps the id");
  assert.equal(knownDevice(`${DEVICE_COOKIE}=${encodeURIComponent(issued.slice(0, -2) + "xx")}`), null);
  assert.equal(knownDevice(`${DEVICE_COOKIE}=device:forged`), null);
  assert.equal(knownDevice(undefined), null);
  // The sign-in state is signed with the same key, but it is not a device value.
  process.env.FEISHU_LOGIN_APP_ID ??= "login-throttle-test-app";
  const { stateCookie } = loginRedirect("/admin");
  assert.equal(knownDevice(`${DEVICE_COOKIE}=${encodeURIComponent(stateCookie)}`), null);
});
