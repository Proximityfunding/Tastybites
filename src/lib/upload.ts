import "server-only";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

/** Saves an uploaded image under public/uploads/<subdir> and returns its public URL, or null if no file was given. */
export async function saveUploadedFile(file: File | null, subdir: string): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const rawExt = path.extname(file.name).toLowerCase();
  const ext = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : ".jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

  const dir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(dir, { recursive: true });

  const bytes = await file.arrayBuffer();
  await writeFile(path.join(dir, filename), Buffer.from(bytes));

  return `/uploads/${subdir}/${filename}`;
}
