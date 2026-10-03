"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, RotateCcw } from "lucide-react";
import AboutPhoto from "../AboutPhoto";
import { photoNumber } from "@/lib/about-photo";

export default function AboutPhotoEditor({ settings, onChange, file, onFileChange, disabled }: {
  settings: Record<string, string>;
  onChange: (patch: Record<string, string>) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled: boolean;
}) {
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [error, setError] = useState("");
  const drag = useRef<{ id: number; x: number; y: number; startX: number; startY: number; overflowX: number; overflowY: number } | null>(null);
  const x = photoNumber(settings.about_image_x, 50, 0, 100);
  const y = photoNumber(settings.about_image_y, 50, 0, 100);
  const zoom = photoNumber(settings.about_image_zoom, 1, 1, 3);
  useEffect(() => {
    if (!file) { setPreviewUrl(undefined); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function resetPosition() { onChange({ about_image_x: "50", about_image_y: "50", about_image_zoom: "1" }); }

  return <fieldset className="cms-about-photo-editor md:col-span-2" disabled={disabled}>
    <legend>About photo</legend>
    <p>Upload your portrait, then drag the preview or use the controls to frame it. The preview matches the About section.</p>
    <div className="cms-about-photo-layout">
      <div className="cms-about-photo-preview" onPointerDown={(event) => {
        if (disabled || (event.pointerType === "mouse" && event.button !== 0)) return;
        const image = event.currentTarget.querySelector("img");
        if (!image?.naturalWidth) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const ratio = image.naturalWidth / image.naturalHeight;
        const width = Math.max(rect.width, rect.height * ratio);
        const height = Math.max(rect.height, rect.width / ratio);
        drag.current = { id: event.pointerId, x, y, startX: event.clientX, startY: event.clientY, overflowX: width * zoom - rect.width, overflowY: height * zoom - rect.height };
        event.currentTarget.setPointerCapture(event.pointerId);
      }} onPointerMove={(event) => {
        const start = drag.current;
        if (!start || disabled || event.pointerId !== start.id) return;
        onChange({ about_image_x: String(Math.round(Math.max(0, Math.min(100, start.x - (start.overflowX > 1 ? (event.clientX - start.startX) / start.overflowX * 100 : 0))))), about_image_y: String(Math.round(Math.max(0, Math.min(100, start.y - (start.overflowY > 1 ? (event.clientY - start.startY) / start.overflowY * 100 : 0))))) });
      }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
        <AboutPhoto settings={settings} previewUrl={previewUrl} />
        <span>Drag to reposition</span>
      </div>
      <div className="cms-about-photo-controls">
        <label className="cms-gallery-upload"><ImagePlus size={22} /><span><strong>{file ? "Change selected photo" : "Upload photo"}</strong><small>JPG, PNG, WebP or AVIF · up to 5 MB</small></span><input type="file" aria-label="Upload About photo" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => {
          const selected = event.target.files?.[0]; event.target.value = "";
          if (!selected) return;
          if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(selected.type) || selected.size > 5 * 1024 * 1024) { setError("Choose a JPG, PNG, WebP or AVIF image up to 5 MB."); return; }
          setError(""); onFileChange(selected); resetPosition();
        }} /></label>
        {file && <p className="cms-about-photo-filename">{file.name}</p>}
        {error && <p className="cms-gallery-error" role="alert">{error}</p>}
        <label>Zoom <output>{zoom.toFixed(2)}×</output><input aria-label="Photo zoom" type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => onChange({ about_image_zoom: event.target.value })} /></label>
        <label>Horizontal position <output>{x}%</output><input aria-label="Photo horizontal position" type="range" min="0" max="100" value={x} onChange={(event) => onChange({ about_image_x: event.target.value })} /></label>
        <label>Vertical position <output>{y}%</output><input aria-label="Photo vertical position" type="range" min="0" max="100" value={y} onChange={(event) => onChange({ about_image_y: event.target.value })} /></label>
        <button type="button" className="cms-button cms-button-secondary" onClick={resetPosition}><RotateCcw size={15} />Reset position</button>
        <p>Zoom in if the image already fills the frame. Changes go live when you save site settings.</p>
      </div>
    </div>
  </fieldset>;
}
