import test from "node:test";
import assert from "node:assert/strict";
import { visitorHash } from "../lib/visitor-identity.ts";

const hash = (ip, secret = "test-secret") => visitorHash(new Headers({ "x-forwarded-for": ip }), secret);

test("repeat IPs produce the same private identifier and new IPs differ", () => {
  assert.equal(hash("192.0.2.1"), hash("192.0.2.1"));
  assert.match(hash("192.0.2.1"), /^[a-f0-9]{64}$/);
  assert.notEqual(hash("192.0.2.1"), hash("192.0.2.2"));
  assert.notEqual(hash("192.0.2.1"), hash("192.0.2.1", "another-secret"));
});

test("equivalent IPv6 and mapped IPv4 addresses count as one identity", () => {
  assert.equal(hash("2001:db8::1"), hash("2001:0db8:0:0:0:0:0:1"));
  assert.equal(hash("::ffff:192.0.2.1"), hash("192.0.2.1"));
  assert.equal(hash("::ffff:c000:201"), hash("192.0.2.1"));
});

test("missing or invalid IPs are skipped rather than counted as a shared visitor", () => {
  assert.equal(visitorHash(new Headers(), "secret"), null);
  for (const ip of ["", "unknown", "999.1.1.1", "192.0.2.1:80"]) assert.equal(hash(ip), null);
});

test("reads only the configured proxy header and first forwarded address", () => {
  assert.equal(hash(" 192.0.2.1, 192.0.2.2"), hash("192.0.2.1"));
  const headers = new Headers({ "x-real-ip": "192.0.2.2", "x-forwarded-for": "192.0.2.1" });
  assert.equal(visitorHash(headers, "test-secret", "x-real-ip"), hash("192.0.2.2"));
  assert.equal(visitorHash(headers, "test-secret", "missing-header"), null);
});
