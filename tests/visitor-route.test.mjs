import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = ts.transpileModule(readFileSync(new URL("../app/api/visitors/route.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

async function visit({ user = null, admin = false, authError = null, adminError = null, origin = "https://portfolio.test" } = {}) {
  const env = { ...process.env };
  let writes = 0, checks = 0;
  Object.assign(process.env, { NEXT_PUBLIC_SUPABASE_URL: "https://db.test", SUPABASE_SERVICE_ROLE_KEY: "secret", VISITOR_IP_HEADER: "x-forwarded-for" });
  try {
    const exports = {};
    const modules = {
      "@supabase/supabase-js": { createClient: () => ({ from: () => ({ upsert: async () => { writes++; return { error: null }; } }) }) },
      "@/lib/visitor-identity": { visitorHash: () => "a".repeat(64) },
      "@/lib/supabase/server": { createClient: async () => ({
        auth: { getUser: async () => ({ data: { user }, error: authError }) },
        rpc: async (name) => { assert.equal(name, "is_admin"); checks++; return { data: admin, error: adminError }; },
      }) },
    };
    new Function("require", "exports", source)((name) => { assert.ok(modules[name], name); return modules[name]; }, exports);
    const result = await exports.POST(new Request("https://portfolio.test/api/visitors", { method: "POST", headers: { origin, "x-forwarded-for": "192.0.2.1" } }));
    return { status: result.status, writes, checks };
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in env)) delete process.env[key];
    Object.assign(process.env, env);
  }
}

test("logged-in admins never write a visitor record", async () => {
  assert.deepEqual(await visit({ user: { id: "admin" }, admin: true }), { status: 204, writes: 0, checks: 1 });
});

test("anonymous visitors still count, including a missing auth session", async () => {
  assert.deepEqual(await visit({ authError: { name: "AuthSessionMissingError" } }), { status: 204, writes: 1, checks: 0 });
});

test("signed-in users without admin membership still count", async () => {
  assert.deepEqual(await visit({ user: { id: "visitor" } }), { status: 204, writes: 1, checks: 1 });
});

test("failed session or membership checks do not accidentally count an admin", async () => {
  assert.deepEqual(await visit({ authError: { name: "AuthRetryableFetchError" } }), { status: 503, writes: 0, checks: 0 });
  assert.deepEqual(await visit({ user: { id: "admin" }, adminError: { message: "Unavailable" } }), { status: 503, writes: 0, checks: 1 });
});

test("cross-origin requests are rejected before auth and storage", async () => {
  assert.deepEqual(await visit({ origin: "https://elsewhere.test" }), { status: 403, writes: 0, checks: 0 });
});
