import test from "node:test";
import assert from "node:assert/strict";
import { shouldUseLocalReply, smallTalkReply } from "../lib/chat-routing.ts";

test("greetings and standard portfolio requests bypass Gemini", () => {
  for (const question of ["hi", " HELLO!!! ", "Good morning!", "thanks", "Thank you so much", "bye", "Show me your projects", "What are your skills?", "How can I contact you?", "download cv", "Hi, show me your projects please.", "Are you available for freelance?"]) {
    assert.equal(shouldUseLocalReply(question), true, question);
  }
});

test("complex questions and context-dependent follow-ups still use Gemini", () => {
  for (const question of ["Hi, can you recommend a tech stack for my store?", "hello, why did you choose React?", "Compare your projects", "What are your skills and how would they help my business?", "thanks, can you explain that further?", "Which one?", "Tell me more", "How much would an ecommerce website cost?", "Are you available for a six month project starting next June?", "skills versus experience", "show me your projects? Which is best for my business?"]) {
    assert.equal(shouldUseLocalReply(question), false, question);
  }
});

test("small talk gets an appropriate local response", () => {
  assert.match(smallTalkReply("thanks!").text, /welcome/);
  assert.match(smallTalkReply("bye").text, /visiting/);
  assert.equal(smallTalkReply("hi, help me choose a framework"), null);
});
