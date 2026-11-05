// Only complete, known requests bypass Gemini. Unknown phrasing and follow-ups
// remain model requests, even when they contain words such as "hi" or "skills".
function normalize(question: string) {
  return question.toLowerCase().trim().replace(/[’]/g, "'").replace(/[.!?]+$/g, "").trim().replace(/\s+/g, " ");
}

export function smallTalkReply(question: string): { text: string } | null {
  const q = normalize(question);
  if (/^(hi|hello|hey|good morning|good afternoon|good evening)( there)?$/.test(q)) {
    return { text: "Hello! I’m the portfolio assistant. I can help you explore projects, skills, experience, or ways to get in touch." };
  }
  if (/^(thanks|thank you|thanks a lot|thank you so much|thank you very much|many thanks|thx)$/.test(q)) {
    return { text: "You’re welcome! Let me know if you’d like to explore anything else in the portfolio." };
  }
  if (/^(bye|goodbye|bye bye|see you|see you later)$/.test(q)) {
    return { text: "Thanks for visiting! Feel free to come back whenever you’d like to explore more." };
  }
  return null;
}

export function shouldUseLocalReply(question: string): boolean {
  if (smallTalkReply(question)) return true;
  const q = normalize(question)
    .replace(/^(hi|hello|hey)[,!]?\s+/, "")
    .replace(/^please\s+/, "")
    .replace(/,?\s+please$/, "");
  return [
    /^(projects?|portfolio|skills?|experience|contact|email|resume|cv|availability)$/,
    /^(show|show me|list|list your|browse|view|see|see your) (your |the )?(projects?|portfolio|skills?|experience)$/,
    /^what (are|is) your (skills|experience|email|email address|availability|tech stack)$/,
    /^tell me about (your |the )?(projects|skills|experience)$/,
    /^(how (can|do) i (contact|reach|hire) you|how can i get in touch|get in touch|contact details|your email)$/,
    /^(are you available|are you available for (work|hire|freelance)|what is your availability)$/,
    /^(download|view|show|show me) (your |the )?(resume|cv)$/,
    /^(who are you|tell me about yourself|about you)$/,
  ].some((pattern) => pattern.test(q));
}


export type ChatContext = {
  settings: { display_name: string; hero_description: string; availability: string; email: string };
  projects: { title: string; desc: string; tech: string[] }[];
  skills: { label: string }[];
  experiences: { role: string; company: string; period: string }[];
};

export type ChatReply = { text: string; link?: { label: string; href: string } };

export function portfolioReply(question: string, context: ChatContext): ChatReply {
  const smallTalk = smallTalkReply(question);
  if (smallTalk) return smallTalk;
  const q = question.toLowerCase().trim();
  const { settings, projects, skills, experiences } = context;
  if (/\b(contact|email|hire|hiring|available|availability|freelance|price|pricing|cost|quote|rate|budget|reach|touch)\b/.test(q)) {
    return { text: `${settings.availability}. You can reach ${settings.display_name} at ${settings.email}. For project pricing and timelines, share your requirements through the contact form.`, link: { label: "Let's talk", href: "#contact" } };
  }
  if (/\b(resume|cv|download)\b/.test(q)) {
    return { text: "You can find the resume in the About section.", link: { label: "View About & resume", href: "#about" } };
  }
  const project = projects.find((item) => q.includes(item.title.toLowerCase()) || item.title.toLowerCase().split(/\s+[–—-]\s+/)[0].length > 3 && q.includes(item.title.toLowerCase().split(/\s+[–—-]\s+/)[0]));
  if (project) return { text: `${project.title}\n${project.desc}\nTechnologies: ${(project.tech ?? []).join(", ")}`, link: { label: "Explore projects", href: "#projects" } };
  if (/\b(projects?|portfolio|work|built|showcase)\b/.test(q)) {
    return { text: projects.length ? `Here are some projects to explore:\n\n${projects.slice(0, 4).map((item) => `• ${item.title}`).join("\n")}\n\nAsk about a project by name, or browse the full collection.` : "Browse the Projects section for the latest published work.", link: { label: "Browse projects", href: "#projects" } };
  }
  if (/\b(skills?|stack|technolog\w*|languages?|react|next\.?js|php|laravel|flutter|backend|frontend|development|services)\b/.test(q)) {
    return { text: `The portfolio lists these skills:\n\n${skills.map((skill) => skill.label).join(" • ")}`, link: { label: "Explore skills", href: "#skills" } };
  }
  if (/\b(experience|career|jobs?|companies|background)\b/.test(q)) {
    return { text: experiences.length ? experiences.map((item) => `${item.role} at ${item.company}\n${item.period}`).join("\n\n") : "Visit the Experience section for career details.", link: { label: "View experience", href: "#experience" } };
  }
  if (/\b(about|who|jimmy|yourself)\b/.test(q)) {
    return { text: `${settings.display_name}: ${settings.hero_description}`, link: { label: "More about me", href: "#about" } };
  }
  if (/\b(hi|hello|hey|thanks|thank)\b/.test(q)) return { text: `Hello! I’m ${settings.display_name}’s portfolio assistant. I can help you explore projects, skills, experience, or ways to get in touch.` };
  return { text: "I can answer questions about this portfolio’s projects, skills, experience, and contact details. For anything else, send a message directly to discuss it.", link: { label: "Contact directly", href: "#contact" } };
}
