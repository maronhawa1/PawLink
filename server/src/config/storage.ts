import "dotenv/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Shared rules for uploaded images. The bucket is configured with the same
// limits by `npm run storage:setup`, so Supabase enforces them as well.
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type ImageContentType = keyof typeof IMAGE_TYPES;

export const IMAGE_FOLDERS = ["pets", "reports"] as const;
export type ImageFolder = (typeof IMAGE_FOLDERS)[number];

export const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET?.trim() || "pawlink-images";

let client: SupabaseClient | null | undefined;

// Returns null when Supabase is not configured, so the rest of the API
// still starts; the upload endpoint then answers 503.
export function getStorageClient(): SupabaseClient | null {
  if (client !== undefined) {
    return client;
  }

  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    console.warn(
      "Image uploads are disabled: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env",
    );
    client = null;
    return client;
  }

  // The service role key bypasses Storage policies. It must stay on the
  // server and never be sent to the browser.
  client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}
