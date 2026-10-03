"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, ImageOff, X } from "lucide-react";
import "./project-gallery.css";

export default function ProjectGallery({ title, images, onClose }: { title: string; images: string[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const thumbnails = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const count = images.length;
  const change = (step: number) => setIndex((current) => (current + step + count) % count);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close.current();
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        setIndex((current) => (current + (event.key === "ArrowLeft" ? -1 : 1) + count) % count);
      }
      if (event.key === "Tab") {
        const buttons = Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? []);
        const first = buttons[0]; const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", onKey); previousFocus?.focus(); };
  }, [count]);

  useEffect(() => {
    const strip = thumbnails.current;
    const selected = strip?.children[index] as HTMLElement | undefined;
    if (strip && selected) strip.scrollLeft = selected.offsetLeft - strip.offsetLeft - (strip.clientWidth - selected.clientWidth) / 2;
  }, [index]);

  return createPortal(<div className="project-gallery-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="project-gallery" ref={dialog} role="dialog" aria-modal="true" aria-label={`${title} gallery`}>
      <header><div><span className="project-gallery-eyebrow">PROJECT GALLERY</span><h2>{title}</h2></div><button ref={closeButton} type="button" aria-label="Close gallery" onClick={onClose}><X size={22} /></button></header>
      <figure className="project-gallery-figure">
        <div className="project-gallery-stage" onTouchStart={(event) => { touch.current = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null; }} onTouchCancel={() => { touch.current = null; }} onTouchEnd={(event) => {
          const start = touch.current; touch.current = null;
          if (!start || !event.changedTouches[0]) return;
          const dx = event.changedTouches[0].clientX - start.x; const dy = event.changedTouches[0].clientY - start.y;
          if (count > 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) change(dx < 0 ? 1 : -1);
        }}>
          {failedImage === images[index] ? <div className="project-gallery-error" role="status"><ImageOff size={30} /><p>This photo couldn’t be loaded.</p><button type="button" onClick={() => setFailedImage(null)}>Try again</button></div> : <img key={images[index]} src={images[index]} alt={`${title} — ${index === 0 ? "cover" : `project screenshot ${index + 1}`}`} onError={() => setFailedImage(images[index])} draggable={false} />}
          {count > 1 && <><button className="project-gallery-prev" type="button" aria-label="Previous photo" onClick={() => change(-1)}><ChevronLeft size={23} /></button><button className="project-gallery-next" type="button" aria-label="Next photo" onClick={() => change(1)}><ChevronRight size={23} /></button></>}
        </div>
        <figcaption aria-live="polite"><span>{index === 0 ? "Cover photo" : `Project preview ${index + 1}`}</span><span>{index + 1} / {count}</span></figcaption>
      </figure>
      {count > 1 && <div className="project-gallery-thumbnails" ref={thumbnails} aria-label="Choose a photo">{images.map((url, photoIndex) => <button type="button" key={`${url}-${photoIndex}`} aria-label={`Show photo ${photoIndex + 1}`} aria-pressed={index === photoIndex} onClick={() => setIndex(photoIndex)}><img loading="lazy" src={url} alt="" /></button>)}</div>}
      {count > 1 && <p className="project-gallery-hint">Swipe or use the arrow buttons to explore</p>}
    </div>
  </div>, document.body);
}
