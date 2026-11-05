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
