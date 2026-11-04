import test from "node:test";
import assert from "node:assert/strict";
import { geminiReply } from "../lib/gemini-chat.ts";

const options = { apiKey: "test-key", model: "test-model" };

const success = (tokens = 150) => Response.json({ usageMetadata: { totalTokenCount: tokens }, candidates: [{ finishReason: "STOP", content: { parts: [{ text: "Hello!" }] } }] });

test("disabled Gemini never calls Google's API", async () => {
  let reason;
  const result = await geminiReply("Hi", {}, [], { ...options, onFailure: (value) => { reason = value; },
    budget: { isEnabled: async () => false, reserve: async () => assert.fail("Must not reserve"), settle: async () => assert.fail("Must not settle") },
    fetcher: async () => assert.fail("Disabled Gemini must not contact Google"),
  });
  assert.equal(result, null);
  assert.equal(reason, "gemini_disabled");
});

test("exhausted budget does not generate a reply", async () => {
  let reason;
  const result = await geminiReply("Hi", {}, [], { ...options, onFailure: (value) => { reason = value; },
    budget: { isEnabled: async () => true, reserve: async (amount) => { assert.equal(amount, 1124); return null; }, settle: async () => assert.fail("Must not settle") },
    fetcher: async (url) => { assert.match(url, /:countTokens$/); return Response.json({ totalTokens: 100 }); },
  });
  assert.equal(result, null);
  assert.equal(reason, "daily_token_limit");
});

test("reserve input plus maximum output, then settle reported total usage", async () => {
  const events = [];
  const result = await geminiReply("Hi", {}, [], { ...options,
    budget: { isEnabled: async () => true, reserve: async (amount) => { events.push(["reserve", amount]); return "reservation"; }, settle: async (id, amount) => { events.push(["settle", id, amount]); } },
    fetcher: async (url) => {
      if (url.endsWith(":countTokens")) return Response.json({ totalTokens: 100 });
      events.push(["generate"]); return success();
    },
  });
  assert.equal(result, "Hello!");
  assert.deepEqual(events, [["reserve", 1124], ["generate"], ["settle", "reservation", 150]]);
});

test("retry reserves separately and keeps unknown usage from failed attempts", async () => {
  const settled = [];
  let reserves = 0;
  let generations = 0;
  await geminiReply("Hi", {}, [], { ...options,
    budget: { isEnabled: async () => true, reserve: async () => String(++reserves), settle: async (id, tokens) => { settled.push([id, tokens]); } },
    fetcher: async (url) => {
      if (url.endsWith(":countTokens")) return Response.json({ totalTokens: 100 });
      return ++generations === 1 ? new Response(null, { status: 503 }) : success();
    },
  });
  assert.equal(reserves, 2);
  assert.deepEqual(settled, [["2", 150]]);
});

test("failed budget storage prevents generation", async () => {
  let reason;
  const result = await geminiReply("Hi", {}, [], { ...options, onFailure: (value) => { reason = value; },
    budget: { isEnabled: async () => { throw new Error("budget_storage_unavailable"); }, reserve: async () => null, settle: async () => {} },
    fetcher: async () => assert.fail("Must not generate without enforced budget"),
  });
  assert.equal(result, null);
  assert.equal(reason, "budget_storage_unavailable");
});

test("Gemini receives portfolio context, history and a private header", async () => {
  const reply = await geminiReply("What did I ask?", { skills: ["React"] }, [{ role: "assistant", text: "Projects?" }], {
    ...options,
    fetcher: async (url, init) => {
      assert.doesNotMatch(url, /test-key/);
      assert.equal(init.headers["x-goog-api-key"], "test-key");
      const body = JSON.parse(init.body);
      assert.match(body.contents[0].parts[0].text, /React/);
      assert.equal(body.contents[2].role, "model");
      return Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ thought: true, text: "private thought" }, { text: "Your projects." }] } }] });
    },
  });
  assert.equal(reply, "Your projects.");
});

test("missing API key skips Gemini", async () => {
  assert.equal(await geminiReply("Hi", {}, [], { ...options, apiKey: "", fetcher: async () => assert.fail("Must not call Gemini") }), null);
});

test("provider errors, quota errors, blocked/empty/truncated output and invalid JSON fall back", async () => {
  const responses = [
    new Response(null, { status: 401 }), new Response(null, { status: 429 }), new Response(null, { status: 503 }),
    Response.json({ promptFeedback: { blockReason: "SAFETY" } }),
    Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: " " }] } }] }),
    Response.json({ candidates: [{ finishReason: "MAX_TOKENS", content: { parts: [{ text: "partial" }] } }] }),
    new Response("invalid json"),
  ];
  for (const response of responses) assert.equal(await geminiReply("Hi", {}, [], { ...options, fetcher: async () => response }), null);
});

test("network and timeout exceptions fall back", async () => {
  for (const error of [new Error("offline"), new DOMException("Timed out", "TimeoutError")]) {
    assert.equal(await geminiReply("Hi", {}, [], { ...options, fetcher: async () => { throw error; } }), null);
  }
});

test("temporary service failure retries once and returns a recovered reply", async () => {
  let calls = 0;
  let firstSignal;
  const reply = await geminiReply("Hi", {}, [], { ...options, fetcher: async (_url, init) => {
    calls++;
    if (calls === 1) { firstSignal = init.signal; return new Response(null, { status: 503 }); }
    assert.equal(init.signal, firstSignal, "Retry must share the original deadline");
    return Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: "Hello!" }] } }] });
  } });
  assert.equal(calls, 2);
  assert.equal(reply, "Hello!");
});

test("persistent service failure stops after two attempts with a diagnostic", async () => {
  let calls = 0;
  let reason;
  const reply = await geminiReply("Hi", {}, [], { ...options, onFailure: (value) => { reason = value; }, fetcher: async () => {
    calls++;
    return new Response(null, { status: 503 });
  } });
  assert.equal(calls, 2);
  assert.equal(reply, null);
  assert.equal(reason, "provider_http_503");
});

test("authentication and quota errors do not trigger extra requests", async () => {
  for (const status of [401, 403, 429]) {
    let calls = 0;
    await geminiReply("Hi", {}, [], { ...options, fetcher: async () => { calls++; return new Response(null, { status }); } });
    assert.equal(calls, 1);
  }
});
