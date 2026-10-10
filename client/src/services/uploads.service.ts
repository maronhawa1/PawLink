const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001";

// Same limits as the server (server/src/config/storage.ts).
// Checking here gives instant feedback; the server still validates.
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

export type ImageFolder = "pets" | "reports";

export type UploadedImage = {
  url: string;
  path: string;
  contentType: string;
  size: number;
};

export function validateImageFile(file: File): string | null {
  if (!IMAGE_ACCEPT.split(",").includes(file.type)) {
    return "Choose a JPEG, PNG or WebP image";
  }

  if (file.size > IMAGE_MAX_BYTES) {
    return "Image must be at most 5 MB";
  }

  return null;
}

// Uploads one image and returns its public URL, to save as photoUrl.
// Usage: <input type="file" accept={IMAGE_ACCEPT} />, then
//   const { url } = await uploadImage(file, "reports", token);
export async function uploadImage(
  file: File,
  folder: ImageFolder,
  token: string,
): Promise<UploadedImage> {
  const problem = validateImageFile(file);

  if (problem) {
    throw new Error(problem);
  }

  const body = new FormData();
  body.append("image", file);

  // No Content-Type header: the browser sets the multipart boundary.
  const response = await fetch(`${API_URL}/api/uploads/${folder}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? "Failed to upload the image");
  }

  return data as UploadedImage;
}
