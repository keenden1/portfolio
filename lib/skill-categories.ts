export const skillCategories = [
  { value: "languages_frameworks", label: "Languages & Frameworks" },
  { value: "databases_backend", label: "Databases & Backend" },
] as const;

export type SkillCategory = (typeof skillCategories)[number]["value"];

export function getSkillCategory(skill: { label: string; category?: string | null }): SkillCategory {
  if (skill.category === "languages_frameworks" || skill.category === "databases_backend") return skill.category;
  return /database|firebase|sql|supabase|mongo|redis|backend|rest|api/i.test(skill.label)
    ? "databases_backend"
    : "languages_frameworks";
}
