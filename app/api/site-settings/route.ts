import { readSiteSettings } from "@/lib/site-settings-server";

export async function GET() {
  try {
    const settings = await readSiteSettings();
    return Response.json({ content: { ...settings, resume_url: "/resume" } }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Unable to load site settings" }, { status: 503 });
  }
}
