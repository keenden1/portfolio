"use client";

import React, { useState } from "react";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import {
  Menu, X, Github, Linkedin, Mail, ExternalLink, 
  Download, Code2, Smartphone, Database, Globe 
} from "lucide-react";


const navLinks = [
  { name: "About", href: "#about" },
  { name: "Skills", href: "#skills" },
  { name: "Projects", href: "#projects" },
  { name: "Experience", href: "#experience" },
  { name: "Contact", href: "#contact" },
];

const projects = [
  {
    title: "Restoria – Educational Platform",
    desc: "Modern banking platform with real-time transactions, analytics, and AI insights.",
    tech: ["Next.js", "TypeScript", "Tailwind", "Supabase"],
    live: "#",
    github: "https://github.com/keenden1/Restioria",
    image: "https://picsum.photos/id/1015/800/600",
  },
  {
    title: "CHRR1 – Social Media Human Rights Platform",
    desc: "Twitter/X clone with threads, real-time chat, and AI content suggestions.",
    tech: ["Next.js", "tRPC", "Prisma", "PostgreSQL"],
    live: "#",
    github: "https://github.com/keenden1/humanrights",
    image: "https://picsum.photos/id/106/800/600",
  },
  {
    title: "HR System – Water District Villasis",
    desc: "Generate beautiful UI components with natural language.",
    tech: ["React", "Tailwind", "Framer Motion"],
    live: "#",
    github: "https://github.com/keenden1/Waterdistrict",
    image: "https://picsum.photos/id/201/800/600",
  },
  {
    title: "Digital Serenity – Admin Side",
    desc: "Mobile-first web app that tracks and gamifies your carbon footprint.",
    tech: ["Next.js", "TypeScript", "Mapbox"],
    live: "#",
    github: "https://github.com/keenden1/DigitalSerenityAdmin",
    image: "https://picsum.photos/id/251/800/600",
  },
];

export default function Portfolio() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

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

  return (
    <>
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-600 rounded-2xl flex items-center justify-center font-bold text-2xl">JB</div>
            <span className="text-2xl font-semibold tracking-tight">Jimmy Bautista</span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="hover:text-violet-400 transition-colors">
                {link.name}
              </a>
            ))}
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
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="min-h-screen flex items-center pt-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/10 mb-6">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Available for freelance • Open to full-time roles
            </div>

            <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-6">
              Hi, I'm Jimmy R. Bautista Jr.<br />
              I build <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">exceptional</span> digital experiences.
            </h1>

            <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12">
              Full-Stack Web Developer & UI Engineer • Turning ideas into pixel-perfect, high-performance products.
            </p>

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
      </section>

      {/* ABOUT */}
      <section id="about" className="py-24 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl font-bold mb-8">About Me</h2>
              <div className="space-y-6 text-lg text-zinc-400">
                <p>
                  I'm a passionate full-stack developer with over 6 years of experience crafting delightful digital products.
                </p>
                <p>
                  I specialize in React, Next.js, TypeScript, and modern backend technologies. 
                  My focus is on performance, beautiful interfaces, and building products people love to use.
                </p>
                <p>
                  When I'm not coding, you'll find me exploring new design trends, contributing to open source, or capturing street photography.
                </p>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://picsum.photos/id/64/600/700" 
                alt="Jimmy Bautista"
                className="rounded-3xl shadow-2xl w-full"
              />
              <div className="absolute -bottom-6 -right-6 glass rounded-3xl p-8 max-w-[220px]">
                <div className="text-5xl font-bold">2+</div>
                <div className="text-zinc-400">years experience</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SKILLS */}
      <section id="skills" className="py-24 bg-zinc-900">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-16">Skills & Technologies</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Code2, label: "Laravel & PHP" },
              { icon: Smartphone, label: "Flutter & Dart" },
              { icon: Database, label: "Firebase" },
              { icon: Smartphone, label: "Java & Android Studio" },
              { icon: Code2, label: "REST APIs & Backend" },
              { icon: Database, label: "MySQL & SQL" },
              { icon: Smartphone, label: "Mobile App Development" },
              { icon: Globe, label: "Full-Stack Development" },
            ].map((skill, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="glass p-8 rounded-3xl flex flex-col items-center text-center"
              >
                <skill.icon size={48} className="mb-6 text-violet-400" />
                <div className="font-medium text-xl">{skill.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="projects" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-5xl font-bold">Featured Projects</h2>
            <a href="https://github.com/keenden1" target="_blank" className="flex items-center gap-2 text-violet-400 hover:text-violet-300">
              All projects on GitHub <ExternalLink size={18} />
            </a>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -10 }}
                className="project-card glass rounded-3xl overflow-hidden group"
              >
                <img src={project.image} alt={project.title} className="w-full h-64 object-cover" />
                
                <div className="p-8">
                  <h3 className="text-3xl font-semibold mb-3">{project.title}</h3>
                  <p className="text-zinc-400 mb-6">{project.desc}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-8">
                    {project.tech.map((t) => (
                      <span key={t} className="text-xs px-4 py-1.5 bg-white/10 rounded-full">{t}</span>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <a href={project.live} target="_blank" className="flex-1 flex items-center justify-center gap-2 border border-white/30 py-3 rounded-2xl hover:bg-white/5">
                      <ExternalLink size={18} /> Live Demo
                    </a>
                    <a href={project.github} target="_blank" className="flex-1 flex items-center justify-center gap-2 bg-white text-black py-3 rounded-2xl hover:bg-zinc-200">
                      <Github size={18} /> Code
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section id="experience" className="py-24 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-5xl font-bold mb-16">Experience</h2>
          
          <div className="space-y-16">
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
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-24 border-t border-white/10 bg-zinc-900">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold mb-6">Let's build something great together</h2>
          <p className="text-xl text-zinc-400 mb-12">
            Currently open to new opportunities and interesting projects.
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
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 py-5 rounded-2xl text-lg font-semibold hover:scale-[1.02] transition disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
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
            Or email me directly at <a href="mailto:bautistajimmy.dev@gmail.com" className="underline">bautistajimmy.dev@gmail.com</a>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-zinc-500">
          <div>© 2026 Jimmy Bautista. All rights reserved.</div>
          <div className="flex gap-8">
            <a href="https://github.com" target="_blank">GitHub</a>
            <a href="https://linkedin.com" target="_blank">LinkedIn</a>
            <a href="https://twitter.com" target="_blank">Twitter</a>
          </div>
          <div>Made with ❤️ and Next.js 15</div>
        </div>
      </footer>
    </>
  );
}
