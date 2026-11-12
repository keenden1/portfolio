import { createHmac } from "node:crypto";
import { isIP } from "node:net";

// Use only a header overwritten by the deployment's trusted reverse proxy.
export function visitorHash(headers: Headers, secret: string, header = "x-forwarded-for") {
  const raw = headers.get(header)?.split(",")[0]?.trim();
  if (!raw || !isIP(raw)) return null;
  let ip = raw;
  if (isIP(ip) === 6) {
    // URL serialization canonicalizes equivalent compressed IPv6 addresses.
    ip = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
    const mapped = /^::ffff:([a-f0-9]+):([a-f0-9]+)$/i.exec(ip);
    if (mapped) {
      const high = parseInt(mapped[1], 16), low = parseInt(mapped[2], 16);
      ip = `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
    }
  }
  return createHmac("sha256", secret).update(`portfolio-visitor:${ip}`).digest("hex");
}
