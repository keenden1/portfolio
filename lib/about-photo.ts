export const defaultAboutPhoto = {
  about_image_url: "https://picsum.photos/id/64/600/700",
  about_image_x: "50",
  about_image_y: "50",
  about_image_zoom: "1",
};

export function photoNumber(value: string | undefined, fallback: number, min: number, max: number) {
  const number = value?.trim() ? Number(value) : NaN;
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

export function aboutPhotoStyle(settings: Record<string, string>) {
  const x = photoNumber(settings.about_image_x, 50, 0, 100);
  const y = photoNumber(settings.about_image_y, 50, 0, 100);
  return {
    objectPosition: `${x}% ${y}%`,
    transformOrigin: `${x}% ${y}%`,
    transform: `scale(${photoNumber(settings.about_image_zoom, 1, 1, 3)})`,
  };
}
