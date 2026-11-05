export const chatModelOptions = [
  { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash" },
  { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash Lite" },
];
export const defaultChatModels = chatModelOptions.map((model) => model.id);
export function validChatModels(value: unknown): value is string[] {
  return Array.isArray(value) && value.length >= 1 && value.length <= chatModelOptions.length && new Set(value).size === value.length
    && value.every((id) => chatModelOptions.some((model) => model.id === id));
}

export function normalizeChatModels(value: unknown): string[] {
  const supported = Array.isArray(value) ? [...new Set(value)].filter((id): id is string => chatModelOptions.some((model) => model.id === id)) : [];
  return supported.length ? supported : [...defaultChatModels];
}
