"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from "lucide-react";
import { GalleryImage, moveGalleryImage } from "@/lib/project-gallery";

export default function ProjectGalleryEditor({ images, onChange, disabled }: {
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  disabled: boolean;
}) {
  const previews = useRef<string[]>([]);
  const [error, setError] = useState("");
  useEffect(() => () => previews.current.forEach((url) => URL.revokeObjectURL(url)), []);

  function addFiles(files: File[]) {
    if (files.some((file) => !["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setError("Choose JPG, PNG, WebP, GIF, or AVIF images, up to 5 MB each.");
      return;
    }
    setError("");
    const additions = files.map((file) => {
      const url = URL.createObjectURL(file);
      previews.current.push(url);
      return { id: crypto.randomUUID(), file, url };
    });
    onChange([...images, ...additions]);
  }

  return <fieldset className="cms-gallery-editor md:col-span-2" disabled={disabled}>
    <legend>Project gallery <span>{images.length} {images.length === 1 ? "photo" : "photos"}</span></legend>
    <p>The first photo is your project cover. Add screenshots, arrange them, and save the project to publish your gallery.</p>
    <label className="cms-gallery-upload"><ImagePlus size={22} /><span><strong>Add photos</strong><small>Choose multiple images · up to 5 MB each</small></span><input aria-label="Add gallery photos" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple onChange={(event) => { addFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} /></label>
    {error && <p role="alert" className="cms-gallery-error">{error}</p>}
    {images.length > 0 && <ol className="cms-gallery-grid">{images.map((image, index) => <li key={image.id}>
      <div className="cms-gallery-preview"><img src={image.url} alt={`Project photo ${index + 1}`} /><span>{index === 0 ? "Cover" : `Photo ${index + 1}`}</span></div>
      <div className="cms-gallery-image-actions"><button type="button" className="cms-text-button" disabled={disabled || index === 0} onClick={() => onChange(moveGalleryImage(images, index, 0))}>{index === 0 ? "Cover photo" : "Make cover"}</button><button type="button" className="cms-icon-button cms-delete" aria-label={`Remove photo ${index + 1}`} onClick={() => onChange(images.filter((item) => item.id !== image.id))}><Trash2 size={15} /></button></div>
      <div className="cms-gallery-order"><button type="button" className="cms-icon-button" disabled={disabled || index === 0} aria-label={`Move photo ${index + 1} earlier`} onClick={() => onChange(moveGalleryImage(images, index, index - 1))}><ArrowLeft size={15} /></button><span>{index + 1} of {images.length}</span><button type="button" className="cms-icon-button" disabled={disabled || index === images.length - 1} aria-label={`Move photo ${index + 1} later`} onClick={() => onChange(moveGalleryImage(images, index, index + 1))}><ArrowRight size={15} /></button></div>
    </li>)}</ol>}
    {!images.length && <p className="cms-gallery-empty">No photos yet. Add a cover to give visitors a first look at your project.</p>}
  </fieldset>;
}
