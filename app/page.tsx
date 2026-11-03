"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { motion, useReducedMotion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getSkillCategory, skillCategories } from "@/lib/skill-categories";
import ProjectGallery from "./ProjectGallery";
import AboutPhoto from "./AboutPhoto";
import { defaultAboutPhoto } from "@/lib/about-photo";
import { projectImageUrls } from "@/lib/project-gallery";
import {
  Menu, X, Github, Linkedin, Mail, ExternalLink, Images,
  Download, Code2, Smartphone, Database, Globe, Sun, Moon, Sparkles
} from "lucide-react";


const navLinks = [
  { name: "About", href: "#about" },
  { name: "Skills", href: "#skills" },
  { name: "Projects", href: "#projects" },
  { name: "Experience", href: "#experience" },
  { name: "Contact", href: "#contact" },
];

const fallbackProjects = [
  {
    title: "Restoria – Educational Platform",
    desc: "Modern banking platform with real-time transactions, analytics, and AI insights.",
    tech: ["Next.js", "TypeScript", "Tailwind", "Supabase"],
    live: "#",
    github: "https://github.com/keenden1/Restioria",
    image: "https://picsum.photos/id/1015/800/600",
    images: ["https://picsum.photos/id/1015/800/600"],
    projectType: "personal" as const,
  },
  {
    title: "CHRR1 – Social Media Human Rights Platform",
    desc: "Twitter/X clone with threads, real-time chat, and AI content suggestions.",
    tech: ["Next.js", "tRPC", "Prisma", "PostgreSQL"],
    live: "#",
    github: "https://github.com/keenden1/humanrights",
    image: "https://picsum.photos/id/106/800/600",
    images: ["https://picsum.photos/id/106/800/600"],
    projectType: "personal" as const,
  },
  {
    title: "HR System – Water District Villasis",
    desc: "Generate beautiful UI components with natural language.",
    tech: ["React", "Tailwind", "Framer Motion"],
    live: "#",
    github: "https://github.com/keenden1/Waterdistrict",
    image: "https://picsum.photos/id/201/800/600",
    images: ["https://picsum.photos/id/201/800/600"],
    projectType: "personal" as const,
  },
  {
    title: "Digital Serenity – Admin Side",
    desc: "Mobile-first web app that tracks and gamifies your carbon footprint.",
    tech: ["Next.js", "TypeScript", "Mapbox"],
    live: "#",
    github: "https://github.com/keenden1/DigitalSerenityAdmin",
    image: "https://picsum.photos/id/251/800/600",
    images: ["https://picsum.photos/id/251/800/600"],
    projectType: "personal" as const,
  },
];

const fallbackSkills = [
  { icon: "Code2", label: "Laravel & PHP" },
  { icon: "Smartphone", label: "Flutter & Dart" },
  { icon: "Database", label: "Firebase" },
  { icon: "Smartphone", label: "Java & Android Studio" },
  { icon: "Code2", label: "REST APIs & Backend" },
  { icon: "Database", label: "MySQL & SQL" },
];

const fallbackExperiences = [
  { role: "Junior Full-Stack Developer", company: "Eljin Corp", period: "2026 — Present", desc: "Built design system for the Company." },
  { role: "Freelance Full-Stack Developer", company: "Home", period: "2024 — Present", desc: "Developed client projects." },
];

const skillIconMap = { Code2, Smartphone, Database, Globe };

const fallbackSettings = {
  ...defaultAboutPhoto,
  display_name: "Jimmy Bautista",
  hero_title: "Hi, I'm Jimmy R. Bautista Jr.",
  hero_highlight: "exceptional",
  hero_suffix: " digital experiences.",
  availability: "Available for freelance • Open to full-time roles",
  hero_description: "Full-Stack Web Developer & UI Engineer • Turning ideas into pixel-perfect, high-performance products.",
  about_paragraph_1: "I'm a passionate full-stack developer with over 6 years of experience crafting delightful digital products.",
  about_paragraph_2: "I specialize in React, Next.js, TypeScript, and modern backend technologies. My focus is on performance, beautiful interfaces, and building products people love to use.",
  about_paragraph_3: "When I'm not coding, you'll find me exploring new design trends, contributing to open source, or capturing street photography.",
  resume_url: "/JimmyBautista_Resume.pdf",
  years_experience: "2+",
  contact_heading: "Let's build something great together",
  contact_description: "Currently open to new opportunities and interesting projects.",
  email: "bautistajimmy.dev@gmail.com",
  github_url: "https://github.com/keenden1",
  facebook_url: "https://www.facebook.com/jimjimyaw",
  made_with: "Made with ❤️ and Next.js 15",
};

const hasSupabaseConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);
const experienceStartYear = 2024;

type ThemeMode = "light" | "dark" | "amoled";
type ProjectType = "all" | "client" | "personal";

const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "amoled", label: "AMOLED", icon: Sparkles },
];

export default function Portfolio() {
  const reduceMotion = useReducedMotion();
  const currentYear = new Date().getFullYear();
  const yearsExperience = Math.max(0, currentYear - experienceStartYear);
  const [projects, setProjects] = useState(hasSupabaseConfig ? [] : fallbackProjects);
  const [projectType, setProjectType] = useState<ProjectType>("all");
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [skills, setSkills] = useState<(typeof fallbackSkills[number] & { category?: string | null })[]>(fallbackSkills);
  const technologySkills = skills.filter((skill) => !/^(Mobile App Development|Full-Stack Development)$/i.test(skill.label.trim()));
  const skillGroups = skillCategories.map((category) => ({
    title: category.label,
    skills: technologySkills.filter((skill) => getSkillCategory(skill) === category.value),
  }));
  const [experiences, setExperiences] = useState(fallbackExperiences);
  const [settings, setSettings] = useState(fallbackSettings);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [themeReady, setThemeReady] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [gallery, setGallery] = useState<{ title: string; images: string[] } | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedTheme = document.documentElement.dataset.theme as ThemeMode | undefined;
    if (savedTheme && themeOptions.some((option) => option.value === savedTheme)) setTheme(savedTheme);
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle("dark", theme !== "light");
    try {
      window.localStorage.setItem("portfolio-theme", theme);
    } catch {
      // Keep theme switching available when browser storage is disabled.
    }
  }, [theme, themeReady]);

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    const supabase = createClient();
    Promise.all([
      supabase.from("projects").select("title, description, tech, live_url, github_url, image_url, image_urls, project_type").eq("published", true).order("sort_order"),
      supabase.from("skills").select("*").eq("published", true).order("sort_order"),
      supabase.from("experiences").select("role, company, period, description").eq("published", true).order("sort_order"),
      supabase.from("site_settings").select("content").eq("id", 1).maybeSingle(),
    ]).then(([projectsResult, skillsResult, experiencesResult, settingsResult]) => {
      if (projectsResult.error) {
        console.error("Unable to load projects from Supabase:", projectsResult.error.message);
      } else {
        setProjects((projectsResult.data ?? []).map((project) => ({ title: project.title, desc: project.description, tech: project.tech, live: project.live_url, github: project.github_url, image: projectImageUrls(project.image_urls, project.image_url)[0] ?? "", images: projectImageUrls(project.image_urls, project.image_url), projectType: project.project_type ?? "personal" })));
      }
      if (skillsResult.data?.length) setSkills(skillsResult.data);
      if (experiencesResult.data?.length) setExperiences(experiencesResult.data.map((experience) => ({ role: experience.role, company: experience.company, period: experience.period, desc: experience.description })));
      if (settingsResult.data?.content) setSettings({ ...fallbackSettings, ...settingsResult.data.content });
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  const res = await fetch("/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });

  setLoading(false);

  if (res.ok) {
    setFormData({ name: "", email: "", message: "" });
    Swal.fire({
      icon: "success",
      title: "Message Sent!",
      text: "Thanks! I'll get back to you soon.",
      confirmButtonColor: "#7c3aed",
      background: "#18181b",
      color: "#ffffff",
    });
  } else {
    Swal.fire({
      icon: "error",
      title: "Failed to send",
      text: "Something went wrong. Please try again.",
      confirmButtonColor: "#7c3aed",
      background: "#18181b",
      color: "#ffffff",
    });
  }
};

  const ThemeMenu = () => (
    <div className="relative">
      <button
        type="button"
        aria-label="Choose color theme"
        aria-expanded={themeMenuOpen}
        onClick={() => setThemeMenuOpen((open) => !open)}
        className="rounded-xl p-2 transition hover:bg-white/10"
      >
        {theme === "light" ? <Sun size={22} /> : theme === "amoled" ? <Sparkles size={22} /> : <Moon size={22} />}
      </button>
      {themeMenuOpen && (
        <div className="theme-menu absolute right-0 top-12 z-[60] w-44 rounded-xl p-2 shadow-2xl">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => { setTheme(value); setThemeMenuOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${theme === value ? "theme-option-active" : "theme-option"}`}
            >
              <Icon size={20} />
              <span>{label}</span>
              {theme === value && <span className="ml-auto text-sky-400">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between md:justify-center md:gap-20">
          <a href="#top" aria-label="Back to top" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex items-center gap-3">
            <div className="brand-logo w-9 h-9 bg-violet-600 rounded-2xl flex items-center justify-center font-bold text-2xl text-white">JB</div>
          </a>

          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="hover:text-violet-400 transition-colors">
                {link.name}
              </a>
            ))}
            <ThemeMenu />
            <a
              href="/JimmyBautista_Resume.pdf"
              target="_blank"
              className="flex items-center gap-2 px-6 py-3 bg-white text-zinc-950 rounded-2xl font-medium hover:bg-zinc-200 transition"
            >
              <Download size={18} /> Resume
            </a>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden">
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden glass border-t border-white/10 py-6">
            <div className="flex flex-col items-center gap-6 text-lg">
              {navLinks.map((link) => (
                <a key={link.name} href={link.href} onClick={() => setMobileMenuOpen(false)}>
                  {link.name}
                </a>
              ))}
              <a href="/JimmyBautista_Resume.pdf" target="_blank" className="flex items-center gap-2">
                <Download /> Download Resume
              </a>
              <ThemeMenu />
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <motion.section id="top" className="min-h-screen flex items-center pt-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/10 mb-6 hidden">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Available for freelance • Open to full-time roles
            </div>

            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/10 mb-6">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              {settings.availability}
            </div>

            <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-6">
              {settings.hero_title}<br />
              I build <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">{settings.hero_highlight}</span>{settings.hero_suffix}
            </h1>

            <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12 hidden">
              Full-Stack Web Developer & UI Engineer • Turning ideas into pixel-perfect, high-performance products.
            </p>

            <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12">{settings.hero_description}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#projects" className="px-8 py-4 bg-white text-zinc-950 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-zinc-200 transition">
                View My Work
              </a>
              <a href="#contact" className="px-8 py-4 border border-white/30 rounded-2xl font-medium flex items-center justify-center gap-3 hover:bg-white/5 transition">
                Let's Talk
              </a>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ABOUT */}
      <motion.section id="about" initial={reduceMotion ? false : { opacity: 0, y: 36 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={reduceMotion ? undefined : { duration: 0.7, ease: "easeOut" }} className="py-24 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl font-bold mb-8">About Me</h2>
              <div className="space-y-6 text-lg text-zinc-400">
                <p>
                  {settings.about_paragraph_1}
                </p>
                <p>
                  {settings.about_paragraph_2}
                </p>
                <p>
                  {settings.about_paragraph_3}
                </p>
              </div>
            </div>
            <div className="relative">
              <AboutPhoto settings={settings} className="shadow-2xl w-full" />
              <div className="experience-card absolute -bottom-6 -right-6 glass rounded-3xl p-8 max-w-[220px]">
                <div className="text-5xl font-bold">{yearsExperience}+</div>
                <div className="experience-card-label text-zinc-400">years experience</div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* SKILLS */}
      <motion.section id="skills" initial={reduceMotion ? false : { opacity: 0, y: 36 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={reduceMotion ? undefined : { duration: 0.7, ease: "easeOut" }} className="py-24 bg-zinc-900">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-16">Skills & Technologies</h2>
          <div className="space-y-10">
            {skillGroups.filter((group) => group.skills.length > 0).map((group, groupIndex) => (
                <div key={group.title}>
                  <div className="skills-marquee" tabIndex={0} role="region" aria-label={`${group.title} carousel`}>
                  <ul className={`skills-marquee-track ${groupIndex === 0 ? "skills-marquee-right" : ""}`}>
                    {Array.from({ length: 2 * Math.max(2, Math.ceil(6 / group.skills.length)) }, () => group.skills).flat().map((skill, index) => {
                      const Icon = skillIconMap[skill.icon as keyof typeof skillIconMap] ?? Code2;
                      return (
                        <li
                          key={`${skill.label}-${index}`}
                          aria-hidden={index >= group.skills.length ? true : undefined}
                          className="skills-card glass flex w-[240px] shrink-0 flex-col items-center justify-center rounded-3xl px-6 py-8 text-center md:w-[260px]"
                        >
                          <Icon size={44} aria-hidden="true" className="mb-5 text-violet-400" />
                          <div className="font-medium text-xl break-words">{skill.label}</div>
                        </li>
                      );
                    })}
                  </ul>
                  </div>
                </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* PROJECTS */}
      <motion.section id="projects" initial={reduceMotion ? false : { opacity: 0, y: 36 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={reduceMotion ? undefined : { duration: 0.7, ease: "easeOut" }} className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-5xl font-bold">Projects</h2>
            <div className="flex items-center gap-2">
              {(["all", "client", "personal"] as const).map((type) => (
                <button key={type} type="button" onClick={() => { setProjectType(type); setShowAllProjects(false); }} className={`rounded-xl px-4 py-2 text-sm transition ${projectType === type ? "bg-violet-600 text-white" : "text-violet-400 hover:bg-white/5"}`}>
                  {type === "all" ? "All projects" : type === "client" ? "Professional projects" : "Personal projects"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {projects.filter((project) => projectType === "all" || project.projectType === projectType).slice(0, showAllProjects ? projects.length : 4).map((project, index) => (
              <motion.div
                key={index}
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                whileHover={reduceMotion ? undefined : { y: -6 }}
                transition={reduceMotion ? undefined : { duration: 0.55, delay: index * 0.08, ease: "easeOut" }}
                className="project-card glass rounded-3xl overflow-hidden group"
              >
                {project.images.length > 0 ? <button
                  type="button"
                  aria-label={`View ${project.title} gallery, ${project.images.length} photos`}
                  aria-haspopup="dialog"
                  onClick={() => setGallery({ title: project.title, images: project.images })}
                  className="project-gallery-trigger"
                >
                  <img loading="lazy" decoding="async" src={project.image} alt={project.title} className="h-64 w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]" />
                </button> : <div className="flex h-64 items-center justify-center bg-white/5 text-zinc-400"><Images size={36} aria-label="No project photos" /></div>}
                
                <div className="p-8">
                  <h3 className="text-3xl font-semibold mb-3">{project.title}</h3>
                  <p className="text-zinc-400 mb-6">{project.desc}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-8">
                    {project.tech.map((t) => (
                      <span key={t} className="text-xs px-4 py-1.5 bg-white/10 rounded-full">{t}</span>
                    ))}
                  </div>

                  <div className="flex justify-center">
                    <a href={project.live} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 border border-white/30 px-8 py-3 rounded-2xl hover:bg-white/5">
                      <ExternalLink size={18} /> Live Demo
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {projects.filter((project) => projectType === "all" || project.projectType === projectType).length > 4 && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllProjects((showAll) => !showAll)}
                className="rounded-2xl border border-white/30 px-6 py-3 font-medium transition hover:bg-white/5"
              >
                {showAllProjects ? "Show fewer projects" : "Show more projects"}
              </button>
            </div>
          )}
        </div>
      </motion.section>

      {/* EXPERIENCE */}
      <motion.section id="experience" initial={reduceMotion ? false : { opacity: 0, y: 36 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={reduceMotion ? undefined : { duration: 0.7, ease: "easeOut" }} className="py-24 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-5xl font-bold mb-16">Experience</h2>
          
          <div className="space-y-16">
            {experiences.map((exp, i) => (
              <div key={i} className="flex flex-col md:flex-row gap-8">
                <div className="md:w-56 text-zinc-400 shrink-0">{exp.period}</div>
                <div>
                  <div className="text-2xl font-semibold">{exp.role}</div>
                  <div className="text-violet-400 mb-4">{exp.company}</div>
                  <p className="text-zinc-400">{exp.desc}</p>
                </div>
              </div>
            ))}
            <div className="hidden">
            {[
              {
                role: "Junior Full-Stack Developer",
                company: "Eljin Corp • Tarlac",
                period: "2026 — Present",
                desc: "Built design system for the Company."
              },
              {
                role: "Freelance Full-Stack Developer",
                company: "Home • Pangasinan",
                period: "2024 — Present",
                desc: "Developed client projects."
              },
        
            ].map((exp, i) => (
              <div key={i} className="flex flex-col md:flex-row gap-8">
                <div className="md:w-56 text-zinc-400 shrink-0">{exp.period}</div>
                <div>
                  <div className="text-2xl font-semibold">{exp.role}</div>
                  <div className="text-violet-400 mb-4">{exp.company}</div>
                  <p className="text-zinc-400">{exp.desc}</p>
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* CONTACT */}
      <motion.section id="contact" initial={reduceMotion ? false : { opacity: 0, y: 36 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={reduceMotion ? undefined : { duration: 0.7, ease: "easeOut" }} className="py-24 border-t border-white/10 bg-zinc-900">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold mb-6">{settings.contact_heading}</h2>
          <p className="text-xl text-zinc-400 mb-12">
            {settings.contact_description}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="text"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-violet-400"
              required
            />
            <input
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-violet-400"
              required
            />
            <textarea
              placeholder="Tell me about your project..."
              rows={6}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-violet-400"
              required
            />
            
            <button
              type="submit"
              disabled={loading}
              className="contact-submit w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 py-5 rounded-2xl text-lg font-semibold text-white hover:scale-[1.02] transition disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Sending...
                </>
              ) : "Send Message"}
            </button>
          </form>

          <p className="mt-8 text-sm text-zinc-500">
            Or email me directly at <a href={`mailto:${settings.email}`} className="underline">{settings.email}</a>
          </p>
        </div>
      </motion.section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-zinc-400">
          <p>© {currentYear} {settings.display_name}</p>
          <nav aria-label="Footer" className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1">
            <a href={settings.github_url} target="_blank" rel="noopener noreferrer" className="py-2 transition-colors hover:text-violet-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400">GitHub <span aria-hidden="true">↗</span></a>
            <span aria-hidden="true" className="text-zinc-500">·</span>
            <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="py-2 transition-colors hover:text-violet-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400">Facebook <span aria-hidden="true">↗</span></a>
            <span aria-hidden="true" className="text-zinc-500">·</span>
            <a href="#top" className="py-2 transition-colors hover:text-violet-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400">Back to top <span aria-hidden="true">↑</span></a>
          </nav>
        </div>
      </footer>

      {gallery && <ProjectGallery title={gallery.title} images={gallery.images} onClose={() => setGallery(null)} />}
    </>
  );
}
