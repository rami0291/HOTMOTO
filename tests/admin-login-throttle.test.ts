// The password sign-in route's limits (apps/api/src/http/login-throttle.ts). Failure case: a stranger's
// wrong passwords lock the admin out, even of the browser the admin always signs in with.
import { tag } from "./setup.ts";
import assert from "node:assert/strict";
import { after, test } from "node:test";
import Fastify, { type LightMyRequestResponse } from "fastify";
import { DEVICE_COOKIE } from "@hotmoto/backend/admin/auth";
import { config } from "@hotmoto/backend/config";
import { closeDb } from "@hotmoto/backend/db";
import { LIMITS } from "../apps/api/src/http/login-throttle.ts";
import { registerAdminAuth } from "../apps/api/src/routes/admin-auth.ts";

const PASSWORD = `test-password-${tag()}`;
const original = config.adminPassword;
config.adminPassword = PASSWORD;
const app = Fastify({ logger: false });
registerAdminAuth(app);
after(async () => {
  config.adminPassword = original;
  await app.close();
  await closeDb();
});

function signIn(password: string, remoteAddress: string, cookie?: string) {
  return app.inject({
    method: "POST", url: "/api/auth/password", remoteAddress,
    headers: { "content-type": "application/x-www-form-urlencoded", ...(cookie ? { cookie } : {}) },
    payload: new URLSearchParams({ password, return: "/admin" }).toString(),
  });
}
const setCookies = (res: LightMyRequestResponse) => [res.headers["set-cookie"] ?? []].flat();
const deviceOf = (res: LightMyRequestResponse) => setCookies(res).find((c) => c.startsWith(`${DEVICE_COOKIE}=`));

test("a stranger's wrong passwords do not lock the admin out of a browser that signed in before", async () => {
  const first = await signIn(PASSWORD, "192.0.2.10");
  assert.equal(first.headers.location, "/admin");
  const issued = deviceOf(first)!;
  assert.match(issued, /; Path=\/api\/auth; HttpOnly; SameSite=Lax; Max-Age=31536000/);
  const device = issued.split(";")[0]!;

  // Wrong passwords from many addresses: each one counts, and a correct one did not.
  for (let i = 0; i < LIMITS.shared; i++) {
    assert.match(String((await signIn("wrong-password-guess", `198.51.100.${i}`)).headers.location), /error=wrong/);
  }
  // Everyone without a known browser now waits, even with the right password.
  assert.match(String((await signIn(PASSWORD, "192.0.2.10")).headers.location), /error=too-many/);
  assert.match(String((await signIn(PASSWORD, "192.0.2.10", `${DEVICE_COOKIE}=forged`)).headers.location), /error=too-many/);
  // The admin's browser still signs in, and keeps its id.
  const again = await signIn(PASSWORD, "192.0.2.10", device);
  assert.equal(again.headers.location, "/admin");
  assert.ok(setCookies(again).some((c) => c.startsWith("hotmoto_admin=")));
  assert.equal(deviceOf(again)!.split(";")[0], device);
});
