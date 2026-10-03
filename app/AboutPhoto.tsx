import { aboutPhotoStyle, defaultAboutPhoto } from "@/lib/about-photo";

export default function AboutPhoto({ settings, previewUrl, className = "" }: {
  settings: Record<string, string>;
  previewUrl?: string;
  className?: string;
}) {
  return <div className={`overflow-hidden rounded-3xl ${className}`} style={{ aspectRatio: "6 / 7" }}>
    <img src={previewUrl || settings.about_image_url || defaultAboutPhoto.about_image_url} alt={settings.display_name || "About me portrait"} loading="lazy" decoding="async" draggable={false} className="h-full w-full object-cover" style={aboutPhotoStyle(settings)} />
  </div>;
}
