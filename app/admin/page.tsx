"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { createClient } from "@/lib/supabase/client";
import { ArrowDownRight, ArrowUpRight, BriefcaseBusiness, Check, ChevronRight, Code2, Database, ExternalLink, FolderKanban, Globe, LayoutDashboard, LoaderCircle, LogOut, Menu, Moon, Pencil, Plus, Search, Settings2, Smartphone, Sparkles, Sun, Trash2, X } from "lucide-react";
import "./admin.css";
import ProjectGalleryEditor from "./ProjectGalleryEditor";
import { getSkillCategory, skillCategories, type SkillCategory } from "@/lib/skill-categories";
import AboutPhotoEditor from "./AboutPhotoEditor";
import ChatBudgetSettings from "./ChatBudgetSettings";
import { defaultAboutPhoto } from "@/lib/about-photo";
import { GalleryImage, projectImageUrls, resolveGalleryImages } from "@/lib/project-gallery";

type Project = { id: string; title: string; description: string; tech: string[]; live_url: string; github_url: string; image_url: string; image_urls: string[]; sort_order: number; published: boolean; project_type: "client" | "personal" };
type Skill = { category: SkillCategory; id: string; label: string; icon: string; sort_order: number; published: boolean };
type Experience = { id: string; role: string; company: string; period: string; description: string; sort_order: number; published: boolean };
type Settings = Record<string, string>;
type Modal = "project" | "skill" | "experience" | "settings" | null;
type ThemeMode = "light" | "dark" | "amoled";
type Section = "overview" | "projects" | "skills" | "experience" | "settings";
const navigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "skills", label: "Skills", icon: Code2 },
  { id: "experience", label: "Experience", icon: BriefcaseBusiness },
  { id: "settings", label: "Site settings", icon: Settings2 },
] as const;
const sectionCopy: Record<Section, { title: string; description: string }> = {
  overview: { title: "Your portfolio, at a glance.", description: "A little upkeep. A big impression. Make your next update here." },
  projects: { title: "Projects", description: "Curate the work that tells your story." },
  skills: { title: "Skills", description: "Keep your toolkit up to date." },
  experience: { title: "Experience", description: "The roles and milestones behind your work." },
  settings: { title: "Site settings", description: "Make every detail of your portfolio feel like you." },
};

const input = "w-full rounded-xl bg-white/10 px-4 py-3";
const emptyProject = { title: "", description: "", tech: "", live_url: "#", github_url: "#", image_url: "", image_urls: [] as string[], sort_order: 0, published: true, project_type: "personal" as "client" | "personal" };
const emptySkill = { category: "languages_frameworks" as SkillCategory, label: "", icon: "Code2", sort_order: 0, published: true };
const emptyExperience = { role: "", company: "", period: "", description: "", sort_order: 0, published: true };
const defaultSettings: Settings = { ...defaultAboutPhoto, display_name: "Jimmy Bautista", hero_title: "Hi, I'm Jimmy R. Bautista Jr.", hero_highlight: "exceptional", hero_suffix: " digital experiences.", availability: "Available for freelance • Open to full-time roles", hero_description: "Full-Stack Web Developer & UI Engineer • Turning ideas into pixel-perfect, high-performance products.", about_paragraph_1: "I'm a passionate full-stack developer with over 6 years of experience crafting delightful digital products.", about_paragraph_2: "I specialize in React, Next.js, TypeScript, and modern backend technologies.", about_paragraph_3: "When I'm not coding, you'll find me exploring new design trends.", resume_url: "/JimmyBautista_Resume.pdf", contact_heading: "Let's build something great together", contact_description: "Currently open to new opportunities and interesting projects.", email: "bautistajimmy.dev@gmail.com", github_url: "https://github.com/keenden1", facebook_url: "https://www.facebook.com", made_with: "Made with ❤️ and Next.js 15" };

const getAlertTheme = (theme: ThemeMode) => ({
  confirmButtonColor: "#7155db",
  cancelButtonColor: theme === "light" ? "#626a79" : "#525b70",
  background: theme === "light" ? "#ffffff" : theme === "amoled" ? "#000000" : "#1b1d26",
  color: theme === "light" ? "#20232d" : theme === "amoled" ? "#e8e8ec" : "#eef0f6",
  customClass: { popup: "cms-alert" },
});

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("input:not([type=file]), textarea, select, button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key !== "Tab") return;
      const elements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]):not([hidden]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]') ?? []).filter((element) => element.getClientRects().length);
      const first = elements[0]; const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKey); previousFocus?.focus(); };
  }, []);
  return <div className="cms-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-10"><div ref={dialogRef} role="dialog" aria-modal="true" aria-label={title} className={`cms-modal relative mx-auto flex w-full max-h-[calc(100vh-5rem)] max-w-4xl flex-col overflow-hidden rounded-3xl ${modalClass}`}><div className="modal-header relative z-10 flex shrink-0 items-center justify-between px-6 pb-4 pt-6"><div><span className="cms-eyebrow">CONTENT EDITOR</span><h2 className="mt-1 text-2xl font-semibold">{title}</h2></div><button type="button" aria-label="Close editor" onClick={close} className="cms-icon-button"><X size={20} /></button></div><div className="min-h-0 overflow-y-auto px-6 pb-6 pt-4">{children}</div></div></div>;
}

export default function AdminPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return <main className="min-h-screen bg-zinc-950 p-8 text-white">Add Supabase environment variables first.</main>;
  return <AdminDashboard />;
}

function AdminDashboard() {
  const supabase = createClient();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [userEmail, setUserEmail] = useState<string | null>(null); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const [saving, setSaving] = useState(false); const [modal, setModal] = useState<Modal>(null); const [theme, setTheme] = useState<ThemeMode>("light"); const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [section, setSection] = useState<Section>("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  const [aboutPhotoFile, setAboutPhotoFile] = useState<File | null>(null);
  const [projects, setProjects] = useState<Project[]>([]); const [skills, setSkills] = useState<Skill[]>([]); const [experiences, setExperiences] = useState<Experience[]>([]); const [settings, setSettings] = useState(defaultSettings);
  const [project, setProject] = useState(emptyProject); const [projectInitial, setProjectInitial] = useState(emptyProject); const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]); const [galleryDirty, setGalleryDirty] = useState(false); const [skill, setSkill] = useState(emptySkill); const [skillInitial, setSkillInitial] = useState(emptySkill); const [experience, setExperience] = useState(emptyExperience); const [experienceInitial, setExperienceInitial] = useState(emptyExperience); const [settingsInitial, setSettingsInitial] = useState(defaultSettings); const [editingProject, setEditingProject] = useState<string | null>(null); const [editingSkill, setEditingSkill] = useState<string | null>(null); const [editingExperience, setEditingExperience] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem("portfolio-theme") as ThemeMode | null;
      if (savedTheme && themeOptions.some((option) => option.value === savedTheme)) setTheme(savedTheme);
    } catch {
      // Use the default theme if browser storage is unavailable.
    } finally {
      setThemeReady(true);
    }
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    document.documentElement.dataset.theme = theme;
    try { window.localStorage.setItem("portfolio-theme", theme); } catch { /* The selected theme still works when storage is unavailable. */ }
  }, [theme, themeReady]);

  useEffect(() => {
    if (modal === "project") setProjectInitial(project);
    if (modal === "skill") setSkillInitial(skill);
    if (modal === "experience") setExperienceInitial(experience);
    if (modal === "settings") {
      setSettingsInitial(settings);
    }
  }, [modal]);

  async function load() {
    setContentLoading(true);
    try {
    const [p, s, e, st] = await Promise.all([supabase.from("projects").select("*").order("sort_order"), supabase.from("skills").select("*").order("sort_order"), supabase.from("experiences").select("*").order("sort_order"), supabase.from("site_settings").select("content").eq("id", 1).maybeSingle()]);
    const error = p.error || s.error || e.error || st.error; if (error) setMessage(error.message); if (p.data) setProjects(p.data as Project[]); if (s.data) setSkills(s.data.map((item) => ({ ...item, category: getSkillCategory(item) })) as Skill[]); if (e.data) setExperiences(e.data as Experience[]); if (st.data?.content) { const nextSettings = { ...defaultSettings, ...st.data.content }; setSettings(nextSettings); setSettingsInitial(nextSettings); }
    } catch { setMessage("Unable to load content. Please try again."); }
    finally { setContentLoading(false); }
  }
  useEffect(() => { supabase.auth.getUser().then(async ({ data }) => { setUserEmail(data.user?.email ?? null); if (data.user) await load(); }).catch(() => setMessage("Unable to check your session. Please sign in again.")).finally(() => setAuthLoading(false)); }, []);
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
          ...getAlertTheme(theme),
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
    if (saving) return;
    setSaving(true);
    setMessage("");
    const draft = galleryImages.map((image) => ({ ...image }));
    try {
      const imageUrls = await resolveGalleryImages(draft, async (file) => {
        if (!["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(file.type) || file.size > 5 * 1024 * 1024) {
          throw new Error("Choose supported images up to 5 MB each.");
        }
        const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" }[file.type] ?? "jpg";
        const path = `projects/${crypto.randomUUID()}.${extension}`;
        const result = await supabase.storage.from("project-images").upload(path, file, { cacheControl: "2592000", contentType: file.type, upsert: false });
        if (result.error) throw new Error(result.error.message);
        return supabase.storage.from("project-images").getPublicUrl(path).data.publicUrl;
      });
      setGalleryImages(draft);
      await save("projects", { ...project, image_url: imageUrls[0] ?? "", image_urls: imageUrls, sort_order: editingProject ? project.sort_order : projects.length + 1, tech: project.tech.split(",").map((x) => x.trim()).filter(Boolean) }, editingProject, () => {
        setProject(emptyProject);
        setGalleryImages([]);
        setGalleryDirty(false);
        setEditingProject(null);
      }, "Project and gallery saved.");
    } catch (error) {
      setGalleryImages(draft);
      setMessage(error instanceof Error ? error.message : "Unable to save the project. Please try again.");
    } finally {
      setSaving(false);
    }
  }
  async function save(table: string, value: object, id: string | null, reset: () => void, success: string) {
    setSaving(true);
    const result = id ? await supabase.from(table).update(value).eq("id", id) : await supabase.from(table).insert(value);
    if (result.error) {
      setMessage(result.error.message);
      setSaving(false);
      return;
    }

    reset();
    setModal(null);
    setMessage(success);
    await load();
    await Swal.fire({
      ...getAlertTheme(theme),
      icon: "success",
      title: "Saved successfully",
      text: success,
    });
    setSaving(false);
  }
  async function remove(table: string, id: string) {
    const result = await Swal.fire({
      ...getAlertTheme(theme),
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
    if (saving) return;
    setSaving(true);
    setMessage("");
    try {
      const nextSettings = { ...settings };
      if (aboutPhotoFile) {
        const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
        const extension = extensions[aboutPhotoFile.type];
        if (!extension || aboutPhotoFile.size > 5 * 1024 * 1024) throw new Error("Choose a supported image up to 5 MB.");
        const path = `about/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from("project-images").upload(path, aboutPhotoFile, { cacheControl: "2592000", contentType: aboutPhotoFile.type, upsert: false });
        if (error) throw new Error(error.message);
        nextSettings.about_image_url = supabase.storage.from("project-images").getPublicUrl(path).data.publicUrl;
        // Reuse the uploaded photo if saving the settings needs to be retried.
        setSettings(nextSettings);
        setAboutPhotoFile(null);
      }
      const { error } = await supabase.from("site_settings").upsert({ id: 1, content: nextSettings, updated_at: new Date().toISOString() });
      if (error) throw new Error(error.message);
      setSettings(nextSettings);
      setSettingsInitial(nextSettings);
      setMessage("Site settings and About photo saved.");
      setModal(null);
      await Swal.fire({ ...getAlertTheme(theme), icon: "success", title: "Saved successfully", text: "Site settings and About photo saved." });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save site settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) return <main className="cms-shell cms-auth"><div role="status" className="cms-loading"><LoaderCircle className="animate-spin" size={24} /> Opening your workspace…</div></main>;
  if (!userEmail) return <main className="cms-shell cms-auth"><section className="cms-auth-intro"><a className="cms-brand" href="/"><span className="cms-brand-mark">jb<span>.</span></span><span>Portfolio<span className="cms-brand-subtitle">CONTENT STUDIO</span></span></a><div className="cms-auth-story"><span className="cms-eyebrow">YOUR WORK. YOUR STORY.</span><h1>Good work deserves<br />a great showcase<span>.</span></h1><p>Your own space to curate projects, share your experience, and keep your portfolio fresh.</p><div className="cms-auth-preview" aria-label="Portfolio content you can manage"><div className="cms-auth-preview-head"><span>YOUR PORTFOLIO</span><span className="cms-auth-preview-live"><i /> READY TO SHAPE</span></div><div className="cms-auth-preview-items"><div><span className="cms-auth-preview-icon cms-auth-preview-project">01</span><span><strong>Selected work</strong><small>Projects that tell your story</small></span><ArrowUpRight size={16} /></div><div><span className="cms-auth-preview-icon cms-auth-preview-experience">02</span><span><strong>Your journey</strong><small>Experience, skills, and more</small></span><ArrowUpRight size={16} /></div></div><div className="cms-auth-preview-foot"><span>Made to grow with you</span><span className="cms-auth-preview-dots"><i /><i /><i /></span></div></div></div><span className="cms-auth-caption">A home for everything you create.</span></section><section className="cms-auth-form-wrap"><form onSubmit={signIn} className="cms-auth-form"><span className="cms-eyebrow">PORTFOLIO CMS</span><h2>Welcome back.</h2><p>Sign in to your content workspace.</p><label>Email address<input className={input} type="email" autoComplete="username" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label>Password<input className={input} type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label><a href="/admin/forgot-password" className="cms-forgot">Forgot password?</a><button disabled={busy} className="cms-button cms-button-primary">{busy ? <LoaderCircle size={17} className="animate-spin" /> : null}{busy ? "Signing in…" : "Sign in to workspace"}<ArrowUpRight size={17} /></button>{message && <p role="alert" className="cms-notice">{message}</p>}<a href="/" className="cms-back-link">← Back to portfolio</a></form><span className="cms-auth-form-note"><span /> Private workspace · Just for you</span></section></main>;

  const update = (key: string, value: string) => setSettings({ ...settings, [key]: value });
  const field = (key: string, label: string, area = false) => <label className="space-y-2"><span>{label}</span>{area ? <textarea className={input} rows={3} value={settings[key]} onChange={(e) => update(key, e.target.value)} /> : <input className={input} value={settings[key]} onChange={(e) => update(key, e.target.value)} />}</label>;
  const projectDirty = JSON.stringify(project) !== JSON.stringify(projectInitial) || galleryDirty;
  const skillDirty = JSON.stringify(skill) !== JSON.stringify(skillInitial);
  const experienceDirty = JSON.stringify(experience) !== JSON.stringify(experienceInitial);
  const settingsDirty = JSON.stringify(settings) !== JSON.stringify(settingsInitial) || aboutPhotoFile !== null;
  async function signOut() {
    const result = await Swal.fire({
      ...getAlertTheme(theme),
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
      ...getAlertTheme(theme),
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
              {theme === value && <span className="cms-theme-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const SelectedSkillIcon = skillIconMap[skill.icon as keyof typeof skillIconMap] ?? Code2;
  function navigate(next: Section) { setSection(next); setSearch(""); setStatusFilter("all"); setSidebarOpen(false); }
  function addItem(type: Exclude<Modal, null>) {
    setMessage("");
    if (type === "project") { setProject(emptyProject); setGalleryImages([]); setGalleryDirty(false); setEditingProject(null); }
    if (type === "skill") { setSkill(emptySkill); setEditingSkill(null); }
    if (type === "experience") { setExperience(emptyExperience); setEditingExperience(null); }
    setModal(type);
  }
  function editProject(item: Project) { setMessage(""); setProject({ ...item, project_type: item.project_type ?? "personal", tech: (item.tech ?? []).join(", ") }); setGalleryImages(projectImageUrls(item.image_urls, item.image_url).map((url) => ({ id: crypto.randomUUID(), url }))); setGalleryDirty(false); setEditingProject(item.id); setModal("project"); }
  const allContent = [...projects, ...skills, ...experiences];
  const publishedCount = allContent.filter((item) => item.published).length;
  const draftCount = allContent.length - publishedCount;
  const matches = (text: string, published: boolean) => text.toLowerCase().includes(search.toLowerCase()) && (statusFilter === "all" || (statusFilter === "published" ? published : !published));
  const visibleProjects = projects.filter((item) => matches(`${item.title} ${item.description} ${(item.tech ?? []).join(" ")}`, item.published));
  const visibleSkills = skills.filter((item) => matches(item.label, item.published));
  const visibleExperiences = experiences.filter((item) => matches(`${item.role} ${item.company} ${item.period}`, item.published));
  const counts = { projects: projects.length, skills: skills.length, experience: experiences.length };
  const badge = (published: boolean) => <span className={`cms-badge ${published ? "is-published" : "is-draft"}`}><span />{published ? "Published" : "Draft"}</span>;
  const emptyState = (label: string, type: Exclude<Modal, null>) => <div className="cms-empty"><div className="cms-empty-icon"><Search size={25} /></div><h3>{search || statusFilter !== "all" ? "No matching content" : `Your ${label} start here`}</h3><p>{search || statusFilter !== "all" ? "Try a different search or status filter." : `Add your first ${type} to bring your portfolio to life.`}</p>{search || statusFilter !== "all" ? <button className="cms-button cms-button-secondary" onClick={() => { setSearch(""); setStatusFilter("all"); }}>Clear filters</button> : <button className="cms-button cms-button-primary" onClick={() => addItem(type)}><Plus size={16} />Add {type}</button>}</div>;
  const renderProjects = (items: Project[]) => <div className="cms-project-list">{items.map((item) => <article key={item.id} className="cms-project-row"><div className="cms-project-cover">{item.image_url || item.image_urls?.[0] ? <img src={item.image_url || item.image_urls[0]} alt="" loading="lazy" /> : <FolderKanban size={23} />}</div><div className="cms-project-info"><button className="cms-title-button" onClick={() => editProject(item)}>{item.title}</button><p>{item.description}</p><div className="cms-project-tags"><span>{item.project_type === "client" ? "Client project" : "Personal project"}</span>{(item.tech ?? []).slice(0, 3).map((tech) => <span key={tech}>{tech}</span>)}</div></div>{badge(item.published)}<div className="cms-row-actions"><button className="cms-icon-button" aria-label={`Edit ${item.title}`} onClick={() => editProject(item)}><Pencil size={16} /></button><button className="cms-icon-button cms-delete" aria-label={`Delete ${item.title}`} onClick={() => remove("projects", item.id)}><Trash2 size={16} /></button></div></article>)}</div>;

  return <main className="cms-shell">
    {sidebarOpen && <button className="cms-sidebar-overlay" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
    <aside className={`cms-sidebar ${sidebarOpen ? "is-open" : ""}`}>
      <a href="/" className="cms-brand"><span className="cms-brand-mark">jb<span>.</span></span><span>Portfolio<span className="cms-brand-subtitle">CONTENT STUDIO</span></span></a>
      <div className="cms-workspace-label"><span className="cms-workspace-dot" />Personal workspace</div>
      <span className="cms-nav-label">WORKSPACE</span>
      <nav aria-label="CMS navigation">{navigation.map(({ id, label, icon: Icon }) => <button key={id} className={`cms-nav-item ${section === id ? "is-active" : ""}`} aria-current={section === id ? "page" : undefined} onClick={() => navigate(id)}><Icon size={19} /><span>{label}</span>{id in counts && <span className="cms-nav-count">{counts[id as keyof typeof counts]}</span>}</button>)}</nav>
      <div className="cms-sidebar-bottom"><div className="cms-site-card"><span className="cms-eyebrow">OUT IN THE WORLD</span><h3>Your next opportunity<br />starts with your work.</h3><a href="/" target="_blank" rel="noreferrer">View your portfolio<ArrowUpRight size={17} /></a></div><div className="cms-user"><span className="cms-avatar">{(settings.display_name || userEmail).split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span><div><strong>{settings.display_name}</strong><span title={userEmail}>{userEmail}</span></div><button className="cms-icon-button" aria-label="Sign out" onClick={signOut}><LogOut size={17} /></button></div></div>
    </aside>
    <div className="cms-main">
      <header className="cms-topbar"><div className="cms-breadcrumb"><button className="cms-icon-button cms-mobile-menu" aria-label="Open navigation" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(true)}><Menu size={20} /></button><span>Workspace</span><ChevronRight size={14} /><strong>{navigation.find((item) => item.id === section)?.label}</strong></div><div className="cms-topbar-actions"><span className="cms-private"><span />Admin workspace</span><ThemeMenu /><a href="/" target="_blank" rel="noreferrer" className="cms-button cms-button-secondary cms-preview">View site<ExternalLink size={15} /></a></div></header>
      <div className="cms-content">
        <div className="cms-page-heading"><div><span className="cms-eyebrow">{section === "overview" ? "WELCOME TO YOUR WORKSPACE" : "YOUR PORTFOLIO CONTENT"}</span><h1>{sectionCopy[section].title}</h1><p>{sectionCopy[section].description}</p></div><button className="cms-button cms-button-primary" onClick={() => addItem(section === "skills" ? "skill" : section === "experience" ? "experience" : section === "settings" ? "settings" : "project")}><Plus size={17} />{section === "skills" ? "Add skill" : section === "experience" ? "Add experience" : section === "settings" ? "Edit settings" : "Add project"}</button></div>
        {message && !modal && <div role="status" className="cms-notice"><span>{message}</span><button aria-label="Dismiss message" onClick={() => setMessage("")}><X size={16} /></button></div>}
        {contentLoading ? <div className="cms-loading" role="status"><LoaderCircle size={22} className="animate-spin" />Loading your content…</div> : <>
        {section === "overview" && <>
          <div className="cms-stats">{[{ label: "Total projects", value: projects.length, detail: `${projects.filter((item) => item.published).length} published on your site`, icon: FolderKanban, target: "projects" }, { label: "Skills & tools", value: skills.length, detail: "Your growing toolkit", icon: Code2, target: "skills" }, { label: "Experience", value: experiences.length, detail: "Roles in your journey", icon: BriefcaseBusiness, target: "experience" }, { label: "Published content", value: publishedCount, detail: `${draftCount} ${draftCount === 1 ? "draft" : "drafts"} in your workspace`, icon: Globe, target: "projects" }].map(({ label, value, detail, icon: Icon, target }) => <button key={label} className="cms-stat-card" onClick={() => navigate(target as Section)}><div className="cms-stat-top"><span>{label}</span><Icon size={19} /></div><strong>{value.toString().padStart(2, "0")}</strong><div className="cms-stat-detail"><span>{detail}</span><ArrowUpRight size={16} /></div></button>)}</div>
          <div className="cms-overview-grid"><section className="cms-panel"><div className="cms-panel-heading"><div><h2>Project library</h2><p>A selection of the work you’re building.</p></div><button className="cms-text-button" onClick={() => navigate("projects")}>View all<ArrowUpRight size={16} /></button></div>{projects.length ? renderProjects(projects.slice(0, 4)) : emptyState("projects", "project")}<div className="cms-panel-footer"><span>{projects.length} {projects.length === 1 ? "project" : "projects"} in your library</span><button className="cms-text-button" onClick={() => addItem("project")}><Plus size={15} />Add project</button></div></section>
          <div className="cms-overview-rail"><section className="cms-quick-card"><span className="cms-eyebrow">MAKE IT YOURS</span><h2>A portfolio that<br />keeps up with you.</h2><p>New project? New role? Keep your story moving forward.</p><div className="cms-quick-actions">{[{ type: "project", label: "Add a project", icon: FolderKanban }, { type: "skill", label: "Update your skills", icon: Code2 }, { type: "experience", label: "Add an experience", icon: BriefcaseBusiness }].map(({ type, label, icon: Icon }) => <button key={type} onClick={() => addItem(type as Modal & string)}><Icon size={18} /><span>{label}</span><ArrowUpRight size={16} /></button>)}</div></section><section className="cms-panel cms-profile-card"><div className="cms-panel-heading"><h2>Portfolio details</h2><Settings2 size={18} /></div><div className="cms-profile-body"><div className="cms-profile-avatar">{settings.display_name?.charAt(0) || "J"}<span><Check size={11} /></span></div><strong>{settings.display_name}</strong><p>{settings.email}</p><div className="cms-profile-availability">{settings.availability}</div><button className="cms-button cms-button-secondary" onClick={() => addItem("settings")}>Edit site settings<ArrowDownRight size={16} /></button></div></section></div></div>
        </>}
        {(section === "projects" || section === "skills" || section === "experience") && <section className="cms-panel"><div className="cms-list-toolbar"><div className="cms-filter-tabs" aria-label="Filter by publication status">{["all", "published", "draft"].map((status) => <button key={status} aria-pressed={statusFilter === status} className={statusFilter === status ? "is-active" : ""} onClick={() => setStatusFilter(status)}>{status === "all" ? "All content" : status === "published" ? "Published" : "Drafts"}</button>)}</div><label className="cms-search"><Search size={17} /><input aria-label={`Search ${section}`} placeholder={`Search ${section}…`} value={search} onChange={(event) => setSearch(event.target.value)} />{search && <button aria-label="Clear search" onClick={() => setSearch("")}><X size={14} /></button>}</label></div>
          {section === "projects" && (visibleProjects.length ? renderProjects(visibleProjects) : emptyState("projects", "project"))}
          {section === "skills" && (visibleSkills.length ? <div className="cms-skills-grid">{visibleSkills.map((item) => { const Icon = skillIconMap[item.icon as keyof typeof skillIconMap] ?? Code2; return <article key={item.id} className="cms-skill-card"><div className="cms-skill-icon"><Icon size={23} /></div><h3>{item.label}</h3><p className="text-sm text-zinc-400">{skillCategories.find((category) => category.value === item.category)?.label}</p>{badge(item.published)}<div className="cms-skill-actions"><button className="cms-text-button" onClick={() => { setMessage(""); setSkill(item); setEditingSkill(item.id); setModal("skill"); }}><Pencil size={14} />Edit skill</button><button className="cms-icon-button cms-delete" aria-label={`Delete ${item.label}`} onClick={() => remove("skills", item.id)}><Trash2 size={15} /></button></div></article>; })}</div> : emptyState("skills", "skill"))}
          {section === "experience" && (visibleExperiences.length ? <div className="cms-experience-list">{visibleExperiences.map((item) => <article key={item.id} className="cms-experience-row"><div className="cms-experience-icon"><BriefcaseBusiness size={22} /></div><div className="cms-experience-info"><span className="cms-eyebrow">{item.period}</span><h3>{item.role}</h3><strong>{item.company}</strong><p>{item.description}</p></div>{badge(item.published)}<div className="cms-row-actions"><button className="cms-icon-button" aria-label={`Edit ${item.role}`} onClick={() => { setMessage(""); setExperience(item); setEditingExperience(item.id); setModal("experience"); }}><Pencil size={16} /></button><button className="cms-icon-button cms-delete" aria-label={`Delete ${item.role}`} onClick={() => remove("experiences", item.id)}><Trash2 size={16} /></button></div></article>)}</div> : emptyState("experience", "experience"))}
          <div className="cms-panel-footer"><span>{section === "projects" ? visibleProjects.length : section === "skills" ? visibleSkills.length : visibleExperiences.length} of {counts[section]} items</span><span>Changes appear on your portfolio after saving.</span></div>
        </section>}
        {section === "settings" && <div className="cms-settings-grid">{[{ title: "Identity & introduction", icon: Globe, fields: [["Display name", settings.display_name], ["Hero title", settings.hero_title], ["Introduction", settings.hero_description]] }, { title: "About & availability", icon: BriefcaseBusiness, fields: [["Availability", settings.availability], ["About you", settings.about_paragraph_1], ["Resume", settings.resume_url]] }, { title: "Contact & social links", icon: ExternalLink, fields: [["Email", settings.email], ["GitHub", settings.github_url], ["Facebook", settings.facebook_url]] }].map(({ title, icon: Icon, fields }) => <section className="cms-panel" key={title}><div className="cms-panel-heading"><h2><Icon size={18} />{title}</h2><button className="cms-icon-button" aria-label={`Edit ${title}`} onClick={() => addItem("settings")}><Pencil size={16} /></button></div><dl className="cms-settings-fields">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "Not set"}</dd></div>)}</dl></section>)}</div>}
        </>}
        {section === "settings" && <ChatBudgetSettings />}
        <footer className="cms-footer"><span>Portfolio Content Studio</span><span>Make something worth sharing.<ArrowUpRight size={13} /></span></footer>
      </div>
    </div>
    {modal && message && <div role="alert" className="cms-editor-notice cms-notice"><span>{message}</span><button aria-label="Dismiss message" onClick={() => setMessage("")}><X size={16} /></button></div>}

    {modal === "project" && <ModalBox title={editingProject ? "Edit project" : "Add project"} close={() => { if (!saving) setModal(null); }}><form onSubmit={saveProject} className="grid gap-4 md:grid-cols-2"><ProjectGalleryEditor images={galleryImages} disabled={saving} onChange={(images) => { setGalleryImages(images); setGalleryDirty(true); }} /><label className="space-y-2"><span>Title</span><input className={input} value={project.title} onChange={(e) => setProject({ ...project, title: e.target.value })} required /></label><label className="space-y-2 md:col-span-2"><span>Description</span><textarea className="w-full rounded-xl bg-white/10 px-4 py-3" value={project.description} onChange={(e) => setProject({ ...project, description: e.target.value })} required /></label><label className="space-y-2"><span>Technologies</span><input className={input} placeholder="Next.js, TypeScript" value={project.tech} onChange={(e) => setProject({ ...project, tech: e.target.value })} /></label><label className="space-y-2"><span>Project type</span><select className={input} value={project.project_type} onChange={(e) => setProject({ ...project, project_type: e.target.value as "client" | "personal" })}><option value="personal">Personal project</option><option value="client">Client project</option></select></label><label className="space-y-2"><span>Live URL</span><input className={input} value={project.live_url} onChange={(e) => setProject({ ...project, live_url: e.target.value })} /></label><label className="space-y-2"><span>GitHub URL</span><input className={input} value={project.github_url} onChange={(e) => setProject({ ...project, github_url: e.target.value })} /></label><button type="submit" disabled={saving} hidden={!projectDirty} className="w-fit rounded-xl bg-violet-600 px-5 py-3 font-semibold disabled:cursor-wait disabled:opacity-70">{saving ? "Saving…" : "Save project"}</button></form></ModalBox>}
    {modal === "skill" && <ModalBox title={editingSkill ? "Edit skill" : "Add skill"} close={() => { if (!saving) setModal(null); }}>
      <form className="cms-skill-editor" onSubmit={(e) => {
        e.preventDefault();
        if (saving || !skill.label.trim()) return;
        save("skills", { ...skill, label: skill.label.trim(), sort_order: editingSkill ? skill.sort_order : skills.length + 1 }, editingSkill, () => { setSkill(emptySkill); setEditingSkill(null); }, "Skill saved.");
      }}>
        <p className="cms-skill-intro">Shape your toolkit. Choose a name, an icon, and where it belongs.</p>
        <div className="cms-skill-editor-layout">
          <fieldset className="cms-skill-fields" disabled={saving}>
            <label className="cms-skill-name"><span>Skill name</span><input className={input} placeholder="e.g. React & Next.js" maxLength={80} value={skill.label} onChange={(e) => setSkill({ ...skill, label: e.target.value })} required /><small>The name visitors will see on your portfolio.</small></label>
            <fieldset className="cms-skill-icons"><legend>Choose an icon</legend><div>{skillIconOptions.map((option) => {
              const Icon = skillIconMap[option.value as keyof typeof skillIconMap];
              return <label key={option.value} className={`cms-icon-choice ${skill.icon === option.value ? "is-selected" : ""}`}><input type="radio" name="skill-icon" value={option.value} checked={skill.icon === option.value} onChange={() => setSkill({ ...skill, icon: option.value })} /><Icon size={23} aria-hidden="true" /><span>{option.label}</span></label>;
            })}</div></fieldset>
            <fieldset className="cms-skill-categories"><legend>Carousel placement</legend><div>{skillCategories.map((category, index) => {
              const Icon = index === 0 ? Code2 : Database;
              return <label key={category.value} className={`cms-category-choice ${skill.category === category.value ? "is-selected" : ""}`}><input type="radio" name="skill-category" value={category.value} checked={skill.category === category.value} onChange={() => setSkill({ ...skill, category: category.value })} /><Icon size={21} aria-hidden="true" /><span><strong>{category.label}</strong><small>{index === 0 ? "Top row ? Languages, libraries & frameworks" : "Bottom row ? Data, APIs & server tools"}</small></span><span className="cms-choice-check" aria-hidden="true">{skill.category === category.value && <Check size={12} />}</span></label>;
            })}</div></fieldset>
          </fieldset>
          <aside className="cms-skill-preview"><span className="cms-eyebrow">LIVE PREVIEW</span><div className="cms-skill-preview-card"><div><SelectedSkillIcon size={40} strokeWidth={1.7} aria-hidden="true" /></div><strong>{skill.label.trim() || "Your next skill"}</strong></div><span className="cms-skill-row-tag">{skill.category === "languages_frameworks" ? "Top carousel row" : "Bottom carousel row"}</span><p>A preview of your skill card.<br />Updates as you edit.</p></aside>
        </div>
        <div className="cms-skill-editor-footer"><span>{editingSkill ? "Refine your toolkit." : "Make your expertise visible."}</span><div><button type="button" className="cms-button cms-button-secondary" disabled={saving} onClick={() => setModal(null)}>Cancel</button><button type="submit" className="cms-button cms-button-primary" disabled={saving || !skill.label.trim() || !skillDirty}>{saving ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}{saving ? "Saving?" : editingSkill ? "Save changes" : "Add skill"}</button></div></div>
      </form>
    </ModalBox>}
    {modal === "experience" && <ModalBox title={editingExperience ? "Edit experience" : "Add experience"} close={() => setModal(null)}><form onSubmit={(e) => { e.preventDefault(); save("experiences", { ...experience, sort_order: editingExperience ? experience.sort_order : experiences.length + 1 }, editingExperience, () => { setExperience(emptyExperience); setEditingExperience(null); }, "Experience saved."); }} className="grid gap-4 md:grid-cols-2"><label className="space-y-2"><span>Role</span><input className={input} value={experience.role} onChange={(e) => setExperience({ ...experience, role: e.target.value })} required /></label><label className="space-y-2"><span>Company</span><input className={input} value={experience.company} onChange={(e) => setExperience({ ...experience, company: e.target.value })} required /></label><label className="space-y-2"><span>Period</span><input className={input} value={experience.period} onChange={(e) => setExperience({ ...experience, period: e.target.value })} required /></label><label className="space-y-2 md:col-span-2"><span>Description</span><textarea className="w-full rounded-xl bg-white/10 px-4 py-3" value={experience.description} onChange={(e) => setExperience({ ...experience, description: e.target.value })} required /></label><button type="submit" disabled={saving} hidden={!experienceDirty} className="w-fit rounded-xl bg-violet-600 px-5 py-3 font-semibold disabled:cursor-wait disabled:opacity-70">{saving ? "Saving…" : "Save experience"}</button></form></ModalBox>}
    {modal === "settings" && <ModalBox title="Edit site settings" close={() => { if (!saving) { setSettings(settingsInitial); setAboutPhotoFile(null); setModal(null); } }}><form onSubmit={saveSettings} className="grid gap-4 md:grid-cols-2"><AboutPhotoEditor settings={settings} file={aboutPhotoFile} onFileChange={setAboutPhotoFile} disabled={saving} onChange={(patch) => setSettings((current) => ({ ...current, ...patch }))} />{field("display_name", "Display name")}{field("hero_title", "Hero title")}{field("hero_highlight", "Hero highlighted word")}{field("hero_suffix", "Hero ending")}{field("availability", "Availability")}{field("hero_description", "Hero description", true)}{field("about_paragraph_1", "About paragraph 1", true)}{field("about_paragraph_2", "About paragraph 2", true)}{field("about_paragraph_3", "About paragraph 3", true)}{field("contact_heading", "Contact heading")}{field("contact_description", "Contact description", true)}{field("email", "Email")}{field("github_url", "GitHub URL")}{field("facebook_url", "Facebook URL")}{field("made_with", "Made with text")}<button type="submit" disabled={saving} hidden={!settingsDirty} className="w-fit rounded-xl bg-violet-600 px-5 py-3 font-semibold disabled:cursor-wait disabled:opacity-70 md:col-span-2">{saving ? "Saving…" : "Save site settings"}</button></form></ModalBox>}
  </main>;
}

