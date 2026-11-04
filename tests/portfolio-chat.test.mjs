import test from "node:test";
import assert from "node:assert/strict";
import { portfolioReply } from "../lib/portfolio-chat.ts";

const context = {
  settings: { display_name: "Jamie Example", hero_description: "Web developer", availability: "Open to projects", email: "jamie@example.com" },
  projects: [{ title: "Atlas — Dashboard", desc: "A reporting dashboard", tech: ["React"] }],
  skills: [{ label: "TypeScript" }],
  experiences: [{ role: "Developer", company: "Example Studio", period: "2025–Present" }],
};

test("project questions use the current published project content", () => {
  const reply = portfolioReply("Tell me about Atlas", context);
  assert.match(reply.text, /A reporting dashboard/);
  assert.match(reply.text, /React/);
  assert.equal(reply.link.href, "#projects");
  assert.doesNotMatch(portfolioReply("show projects", { ...context, projects: [] }).text, /Atlas/);
});

test("contact and pricing questions direct visitors to the current owner without inventing rates", () => {
  const reply = portfolioReply("What is the cost of a project?", context);
  assert.match(reply.text, /jamie@example.com/);
  assert.equal(reply.link.href, "#contact");
  assert.doesNotMatch(reply.text, /\$\d/);
});

test("skills, experience and resume answers link to the correct page sections", () => {
  assert.match(portfolioReply("skills", context).text, /TypeScript/);
  assert.match(portfolioReply("experience", context).text, /Example Studio/);
  assert.equal(portfolioReply("download cv", context).link.href, "#about");
});

test("unsupported questions give an honest fallback", () => {
  const reply = portfolioReply("What is the weather?", context);
  assert.match(reply.text, /I can answer questions about this portfolio/);
  assert.equal(reply.link.href, "#contact");
});
