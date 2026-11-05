import { readFile } from "node:fs/promises";
import path from "node:path";
import { readSiteSettings } from "@/lib/site-settings-server";
import { resumeUnavailableResponse } from "@/lib/resume-unavailable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await readSiteSettings();
    const source = settings.resume_url?.trim();
    let pdf: Uint8Array;
    if (!source || source === "/JimmyBautista_Resume.pdf") {
      pdf = new Uint8Array(await readFile(path.join(process.cwd(), "public", "JimmyBautista_Resume.pdf")));
    } else {
      const url = new URL(source);
      const storage = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
      // Fetch only this project's resume bucket, never arbitrary admin-entered hosts.
      if (url.protocol !== "https:" || url.origin !== storage.origin || url.username || url.password
        || !url.pathname.startsWith("/storage/v1/object/public/resume-files/") || !url.pathname.endsWith(".pdf")) throw new Error("Invalid resume source");
      const upstream = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(10000), cache: "no-store" });
      if (!upstream.ok || !upstream.body) throw new Error("Resume unavailable");
      const reader = upstream.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 10 * 1024 * 1024) { await reader.cancel(); throw new Error("Resume too large"); }
        chunks.push(value);
      }
      pdf = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { pdf.set(chunk, offset); offset += chunk.length; }
    }
    if (new TextDecoder().decode(pdf.slice(0, 5)) !== "%PDF-") throw new Error("Invalid PDF");
    return new Response(pdf as BodyInit, { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="JimmyBautista_Resume.pdf"',
      "Content-Length": String(pdf.byteLength),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    return resumeUnavailableResponse();
  }
}
