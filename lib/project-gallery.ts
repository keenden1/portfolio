export type GalleryImage = { id: string; url: string; file?: File };

export function projectImageUrls(images?: string[] | null, cover?: string | null): string[] {
  const urls = [cover, ...(images ?? [])].filter((url): url is string => typeof url === "string" && url.trim().length > 0);
  return [...new Set(urls)];
}

export function moveGalleryImage<T>(images: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= images.length || to >= images.length) return images;
  const next = [...images];
  const [image] = next.splice(from, 1);
  next.splice(to, 0, image);
  return next;
}

export async function resolveGalleryImages(images: GalleryImage[], upload: (file: File) => Promise<string>): Promise<string[]> {
  // Keep successful uploads on the draft so retrying a failed save does not upload them again.
  const urls: string[] = [];
  for (const image of images) {
    if (image.file) {
      image.url = await upload(image.file);
      delete image.file;
    }
    urls.push(image.url);
  }
  return urls;
}
