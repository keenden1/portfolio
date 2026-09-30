"use client";

import { FormEvent, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { createClient } from "@/lib/supabase/client";
import { Code2, Database, Globe, Moon, Smartphone, Sparkles, Sun } from "lucide-react";

type Project = { id: string; title: string; description: string; tech: string[]; live_url: string; github_url: string; image_url: string; sort_order: number; published: boolean; project_type: "client" | "personal" };
type Skill = { id: string; label: string; icon: string; sort_order: number; published: boolean };
type Experience = { id: string; role: string; company: string; period: string; description: string; sort_order: number; published: boolean };
type Settings = Record<string, string>;
type Modal = "project" | "skill" | "experience" | "settings" | null;
type ThemeMode = "light" | "dark" | "amoled";

const input = "w-full rounded-xl bg-white/10 px-4 py-3";
const emptyProject = { title: "", description: "", tech: "", live_url: "#", github_url: "#", image_url: "", sort_order: 0, published: true, project_type: "personal" as "client" | "personal" };
const emptySkill = { label: "", icon: "Code2", sort_order: 0, published: true };
const emptyExperience = { role: "", company: "", period: "", description: "", sort_order: 0, published: true };
const defaultSettings: Settings = { display_name: "Jimmy Bautista", hero_title: "Hi, I'm Jimmy R. Bautista Jr.", hero_highlight: "exceptional", hero_suffix: " digital experiences.", availability: "Available for freelance • Open to full-time roles", hero_description: "Full-Stack Web Developer & UI Engineer • Turning ideas into pixel-perfect, high-performance products.", about_paragraph_1: "I'm a passionate full-stack developer with over 6 years of experience crafting delightful digital products.", about_paragraph_2: "I specialize in React, Next.js, TypeScript, and modern backend technologies.", about_paragraph_3: "When I'm not coding, you'll find me exploring new design trends.", contact_heading: "Let's build something great together", contact_description: "Currently open to new opportunities and interesting projects.", email: "bautistajimmy.dev@gmail.com", github_url: "https://github.com/keenden1", linkedin_url: "https://linkedin.com", twitter_url: "https://twitter.com", made_with: "Made with ❤️ and Next.js 15" };

const alertTheme = {
  confirmButtonColor: "#7c3aed",
  cancelButtonColor: "#52525b",
  background: "#18181b",
  color: "#ffffff",
};

const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "amoled", label: "AMOLED", icon: Sparkles },
];

const skillIconMap = { Code2, Smartphone, Database, Globe };
const skillIconOptions = [
  { value: "Code2", label: "Code" },
  { value: "Smartphone", label: "Mobile" },
  { value: "Database", label: "Database" },
  { value: "Globe", label: "Globe" },
];

function ModalBox({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  const modalClass = title.toLowerCase().includes("project") ? "project-modal" : "";
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-10"><div className={`cms-modal relative mx-auto max-h-[calc(100vh-5rem)] max-w-4xl overflow-y-auto glass rounded-3xl p-6 ${modalClass}`}><div className="modal-header sticky top-0 z-10 -mx-6 -mt-6 mb-6 flex items-center justify-between bg-zinc-950 px-6 pb-4 pt-6"><h2 className="text-2xl font-semibold">{title}</h2><button type="button" onClick={close} className="text-2xl text-zinc-400 transition hover:text-white">×</button></div>{children}</div></div>;
}

export default function AdminPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return <main className="min-h-screen bg-zinc-950 p-8 text-white">Add Supabase environment variables first.</main>;
  return <AdminDashboard />;
}

function AdminDashboard() {
  const supabase = createClient();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [userEmail, setUserEmail] = useState<string | null>(null); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const [modal, setModal] = useState<Modal>(null); const [theme, setTheme] = useState<ThemeMode>("dark"); const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]); const [skills, setSkills] = useState<Skill[]>([]); const [experiences, setExperiences] = useState<Experience[]>([]); const [settings, setSettings] = useState(defaultSettings);
  const [project, setProject] = useState(emptyProject); const [projectImage, setProjectImage] = useState<File | null>(null); const [projectImagePreview, setProjectImagePreview] = useState<string | null>(null); const [skill, setSkill] = useState(emptySkill); const [experience, setExperience] = useState(emptyExperience); const [editingProject, setEditingProject] = useState<string | null>(null); const [editingSkill, setEditingSkill] = useState<string | null>(null); const [editingExperience, setEditingExperience] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("portfolio-theme") as ThemeMode | null;
    if (savedTheme && themeOptions.some((option) => option.value === savedTheme)) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("portfolio-theme", theme);
  }, [theme]);

  async function load() {
    const [p, s, e, st] = await Promise.all([supabase.from("projects").select("*").order("sort_order"), supabase.from("skills").select("*").order("sort_order"), supabase.from("experiences").select("*").order("sort_order"), supabase.from("site_settings").select("content").eq("id", 1).maybeSingle()]);
    const error = p.error || s.error || e.error || st.error; if (error) setMessage(error.message); if (p.data) setProjects(p.data as Project[]); if (s.data) setSkills(s.data as Skill[]); if (e.data) setExperiences(e.data as Experience[]); if (st.data?.content) setSettings({ ...defaultSettings, ...st.data.content });
  }
  useEffect(() => { supabase.auth.getUser().then(({ data }) => { setUserEmail(data.user?.email ?? null); if (data.user) load(); }); }, []);
  useEffect(() => {
    if (!projectImage) {
      setProjectImagePreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(projectImage);
    setProjectImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [projectImage]);
  async function signIn(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        setUserEmail(data.user?.email ?? null);
        await load();
        await Swal.fire({
          ...alertTheme,
          icon: "success",
          title: "Signed in successfully",
          text: "Welcome back to your portfolio CMS.",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
      }
    } catch {
      setMessage("Unable to sign in. Check your connection.");
    } finally {
      setBusy(false);
    }
  }
  async function saveProject(event: FormEvent) {
    event.preventDefault();
    let imageUrl = project.image_url;

    if (projectImage) {
      if (!projectImage.type.startsWith("image/")) {
        setMessage("Please choose an image file.");
        return;
      }
      if (projectImage.size > 5 * 1024 * 1024) {
        setMessage("Image must be 5 MB or smaller.");
        return;
      }

      const extension = projectImage.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `projects/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("project-images").upload(path, projectImage, {
        // Cache uploaded project images for one month.
        cacheControl: "2592000",
        contentType: projectImage.type,
        upsert: false,
      });

      if (uploadError) {
        setMessage(uploadError.message);
        return;
      }

      imageUrl = supabase.storage.from("project-images").getPublicUrl(path).data.publicUrl;
    }

    await save("projects", { ...project, image_url: imageUrl, sort_order: editingProject ? project.sort_order : projects.length + 1, tech: project.tech.split(",").map((x) => x.trim()).filter(Boolean) }, editingProject, () => {
      setProject(emptyProject);
      setProjectImage(null);
      setEditingProject(null);
    }, "Project saved.");
  }
  async function save(table: string, value: object, id: string | null, reset: () => void, success: string) {
    const result = id ? await supabase.from(table).update(value).eq("id", id) : await supabase.from(table).insert(value);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    reset();
    setModal(null);
    setMessage(success);
    await load();
    await Swal.fire({
      ...alertTheme,
      icon: "success",
      title: "Saved successfully",
      text: success,
    });
  }
  async function remove(table: string, id: string) {
    const result = await Swal.fire({
      ...alertTheme,
      icon: "warning",
      title: "Delete this item?",
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) setMessage(error.message); else load();
  }
  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    const { error } = await supabase.from("site_settings").upsert({ id: 1, content: settings, updated_at: new Date().toISOString() });
    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Site settings saved.");
    setModal(null);
    await Swal.fire({
      ...alertTheme,
      icon: "success",
      title: "Saved successfully",
      text: "Site settings saved.",
    });
  }

  if (!userEmail) return <main className="min-h-screen bg-zinc-950 px-6 flex items-center justify-center text-white"><form onSubmit={signIn} className="glass w-full max-w-md space-y-5 rounded-3xl p-8"><h1 className="text-3xl font-bold">Portfolio CMS</h1><p className="text-zinc-400">Sign in with your Supabase admin account.</p><input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required /><input className={input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required /><button disabled={busy} className="w-full rounded-xl bg-violet-600 py-3 font-semibold disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button><a href="/admin/forgot-password" className="block text-center text-sm text-violet-300">Forgot password?</a>{message && <p className="text-center text-red-300">{message}</p>}</form></main>;

  const update = (key: string, value: string) => setSettings({ ...settings, [key]: value });
  const field = (key: string, label: string, area = false) => <label className="space-y-2"><span>{label}</span>{area ? <textarea className={input} rows={3} value={settings[key]} onChange={(e) => update(key, e.target.value)} /> : <input className={input} value={settings[key]} onChange={(e) => update(key, e.target.value)} />}</label>;
  async function signOut() {
    const result = await Swal.fire({
      ...alertTheme,
      icon: "question",
      title: "Sign out?",
      text: "Are you sure you want to log out?",
      showCancelButton: true,
      confirmButtonText: "Sign out",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    await supabase.auth.signOut();
    setPassword("");
    await Swal.fire({
      ...alertTheme,
      icon: "success",
      title: "Signed out successfully",
      text: "You have been logged out.",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
    setUserEmail(null);
  }

  const ThemeMenu = () => (
    <div className="relative">
      <button
        type="button"
        aria-label="Choose color theme"
        aria-expanded={themeMenuOpen}
        onClick={() => setThemeMenuOpen((open) => !open)}
        className="rounded-xl border border-white/20 p-2 transition hover:bg-white/10"
      >
        {theme === "light" ? <Sun size={20} /> : theme === "amoled" ? <Sparkles size={20} /> : <Moon size={20} />}
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

  const SelectedSkillIcon = skillIconMap[skill.icon as keyof typeof skillIconMap] ?? Code2;

  return <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white"><div className="mx-auto max-w-6xl space-y-8"><header className="flex justify-between"><div><h1 className="text-4xl font-bold">Portfolio CMS</h1><p className="text-zinc-400">Manage all portfolio content.</p></div><div className="flex items-start gap-3"><ThemeMenu /><button onClick={signOut} className="h-fit rounded-xl border border-white/20 px-4 py-2">Sign out</button></div></header>



    <section><div className="mb-3 flex items-center justify-between"><h2 className="text-2xl font-semibold">Projects</h2><button onClick={() => { setProject(emptyProject); setProjectImage(null); setEditingProject(null); setModal("project"); }} className="rounded-xl bg-violet-600 px-4 py-2 font-semibold">Add project</button></div><div className="space-y-3">{projects.map((item) => <article key={item.id} className="glass flex justify-between gap-4 rounded-2xl p-5"><div><h3 className="text-xl font-semibold">{item.title}</h3><p className="text-zinc-400">{item.description}</p></div><div className="flex gap-2"><button onClick={() => { setProject({ ...item, project_type: item.project_type ?? "personal", tech: item.tech.join(", ") }); setProjectImage(null); setEditingProject(item.id); setModal("project"); }} className="text-violet-300">Edit</button><button onClick={() => remove("projects", item.id)} className="text-red-300">Delete</button></div></article>)}</div></section>
    <section><div className="mb-3 flex items-center justify-between"><h2 className="text-2xl font-semibold">Skills</h2><button onClick={() => { setSkill(emptySkill); setEditingSkill(null); setModal("skill"); }} className="rounded-xl bg-violet-600 px-4 py-2 font-semibold">Add skill</button></div><div className="grid gap-3 md:grid-cols-2">{skills.map((item) => <article key={item.id} className="glass flex justify-between rounded-2xl p-4"><span>{item.label}</span><span className="flex gap-3"><button onClick={() => { setSkill(item); setEditingSkill(item.id); setModal("skill"); }} className="text-violet-300">Edit</button><button onClick={() => remove("skills", item.id)} className="text-red-300">Delete</button></span></article>)}</div></section>
    <section><div className="mb-3 flex items-center justify-between"><h2 className="text-2xl font-semibold">Experience</h2><button onClick={() => { setExperience(emptyExperience); setEditingExperience(null); setModal("experience"); }} className="rounded-xl bg-violet-600 px-4 py-2 font-semibold">Add experience</button></div><div className="space-y-3">{experiences.map((item) => <article key={item.id} className="glass flex justify-between rounded-2xl p-4"><div><b>{item.role}</b><p className="text-zinc-400">{item.company} · {item.period}</p></div><span className="flex gap-3"><button onClick={() => { setExperience(item); setEditingExperience(item.id); setModal("experience"); }} className="text-violet-300">Edit</button><button onClick={() => remove("experiences", item.id)} className="text-red-300">Delete</button></span></article>)}</div></section>
    <div className="mb-3 flex items-center justify-between"><h2 className="text-2xl font-semibold">Site settings</h2><button onClick={() => setModal("settings")} className="rounded-xl bg-violet-600 px-4 py-2 font-semibold">Edit site settings</button></div>{message && <p className="rounded-xl bg-violet-500/20 p-4 text-violet-200">{message}</p>}

    {modal === "project" && <ModalBox title={editingProject ? "Edit project" : "Add project"} close={() => setModal(null)}><form onSubmit={saveProject} className="grid gap-4 md:grid-cols-2"><label className="space-y-2"><span>Title</span><input className={input} value={project.title} onChange={(e) => setProject({ ...project, title: e.target.value })} required /></label><label className="space-y-2"><span>Project image</span><input className={input} type="file" accept="image/*" onChange={(e) => setProjectImage(e.target.files?.[0] ?? null)} />{projectImage && <span className="block text-sm text-zinc-400">Selected: {projectImage.name}</span>}{(projectImagePreview || project.image_url) && <img loading="lazy" decoding="async" src={projectImagePreview || project.image_url} alt="Project preview" className="h-32 w-full rounded-xl object-cover" />}</label><label className="space-y-2 md:col-span-2"><span>Description</span><textarea className="w-full rounded-xl bg-white/10 px-4 py-3" value={project.description} onChange={(e) => setProject({ ...project, description: e.target.value })} required /></label><label className="space-y-2"><span>Technologies</span><input className={input} placeholder="Next.js, TypeScript" value={project.tech} onChange={(e) => setProject({ ...project, tech: e.target.value })} /></label><label className="space-y-2"><span>Project type</span><select className={input} value={project.project_type} onChange={(e) => setProject({ ...project, project_type: e.target.value as "client" | "personal" })}><option value="personal">Personal project</option><option value="client">Client project</option></select></label><label className="space-y-2"><span>Live URL</span><input className={input} value={project.live_url} onChange={(e) => setProject({ ...project, live_url: e.target.value })} /></label><label className="space-y-2"><span>GitHub URL</span><input className={input} value={project.github_url} onChange={(e) => setProject({ ...project, github_url: e.target.value })} /></label><button className="w-fit rounded-xl bg-violet-600 px-5 py-3 font-semibold">Save project</button></form></ModalBox>}
    {modal === "skill" && <ModalBox title={editingSkill ? "Edit skill" : "Add skill"} close={() => setModal(null)}><form onSubmit={(e) => { e.preventDefault(); save("skills", { ...skill, sort_order: editingSkill ? skill.sort_order : skills.length + 1 }, editingSkill, () => { setSkill(emptySkill); setEditingSkill(null); }, "Skill saved."); }} className="grid gap-4 md:grid-cols-2"><label className="space-y-2"><span>Skill name</span><input className={input} value={skill.label} onChange={(e) => setSkill({ ...skill, label: e.target.value })} required /></label><label className="space-y-2"><span>Icon</span><div className="flex items-center gap-3"><select className={`${input} flex-1`} value={skill.icon} onChange={(e) => setSkill({ ...skill, icon: e.target.value })}>{skillIconOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400"><SelectedSkillIcon size={28} /></div></div></label><button className="w-fit rounded-xl bg-violet-600 px-5 py-3 font-semibold md:col-span-2">Save skill</button></form></ModalBox>}
    {modal === "experience" && <ModalBox title={editingExperience ? "Edit experience" : "Add experience"} close={() => setModal(null)}><form onSubmit={(e) => { e.preventDefault(); save("experiences", { ...experience, sort_order: editingExperience ? experience.sort_order : experiences.length + 1 }, editingExperience, () => { setExperience(emptyExperience); setEditingExperience(null); }, "Experience saved."); }} className="grid gap-4 md:grid-cols-2"><label className="space-y-2"><span>Role</span><input className={input} value={experience.role} onChange={(e) => setExperience({ ...experience, role: e.target.value })} required /></label><label className="space-y-2"><span>Company</span><input className={input} value={experience.company} onChange={(e) => setExperience({ ...experience, company: e.target.value })} required /></label><label className="space-y-2"><span>Period</span><input className={input} value={experience.period} onChange={(e) => setExperience({ ...experience, period: e.target.value })} required /></label><label className="space-y-2 md:col-span-2"><span>Description</span><textarea className="w-full rounded-xl bg-white/10 px-4 py-3" value={experience.description} onChange={(e) => setExperience({ ...experience, description: e.target.value })} required /></label><button className="w-fit rounded-xl bg-violet-600 px-5 py-3 font-semibold">Save experience</button></form></ModalBox>}
    {modal === "settings" && <ModalBox title="Edit site settings" close={() => setModal(null)}><form onSubmit={saveSettings} className="grid gap-4 md:grid-cols-2">{field("display_name", "Display name")}{field("hero_title", "Hero title")}{field("hero_highlight", "Hero highlighted word")}{field("hero_suffix", "Hero ending")}{field("availability", "Availability")}{field("hero_description", "Hero description", true)}{field("about_paragraph_1", "About paragraph 1", true)}{field("about_paragraph_2", "About paragraph 2", true)}{field("about_paragraph_3", "About paragraph 3", true)}{field("contact_heading", "Contact heading")}{field("contact_description", "Contact description", true)}{field("email", "Email")}{field("github_url", "GitHub URL")}{field("linkedin_url", "LinkedIn URL")}{field("twitter_url", "Twitter URL")}{field("made_with", "Made with text")}<button className="w-fit rounded-xl bg-violet-600 px-5 py-3 font-semibold md:col-span-2">Save site settings</button></form></ModalBox>}
  </div></main>;
}

