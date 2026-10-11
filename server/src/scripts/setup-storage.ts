// Creates or updates the Supabase Storage bucket used for pet and report images.
// Run once per Supabase project:  npm run storage:setup
import {
  IMAGE_MAX_BYTES,
  IMAGE_TYPES,
  STORAGE_BUCKET,
  getStorageClient,
} from "../config/storage.js";

const storage = getStorageClient();

if (!storage) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env first.");
  process.exit(1);
}

// Public read, so the returned URLs work in <img> tags without a token.
// Writes stay server-only: the API uploads with the service role key.
const options = {
  public: true,
  fileSizeLimit: IMAGE_MAX_BYTES,
  allowedMimeTypes: Object.keys(IMAGE_TYPES),
};

const existing = await storage.storage.getBucket(STORAGE_BUCKET);

const { error } = existing.data
  ? await storage.storage.updateBucket(STORAGE_BUCKET, options)
  : await storage.storage.createBucket(STORAGE_BUCKET, options);

if (error) {
  console.error(`Failed to set up bucket "${STORAGE_BUCKET}":`, error.message);
  process.exit(1);
}

console.log(
  `Bucket "${STORAGE_BUCKET}" ${existing.data ? "updated" : "created"}: public, ` +
    `max ${IMAGE_MAX_BYTES / (1024 * 1024)} MB, ${options.allowedMimeTypes.join(", ")}`,
);
