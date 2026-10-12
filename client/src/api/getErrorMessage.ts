import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";

export function getErrorMessage(
  error: FetchBaseQueryError | SerializedError | undefined,
  fallback: string
): string {
  if (!error) {
    return fallback;
  }

  if ("status" in error) {
    if (error.status === "FETCH_ERROR") {
      return "Cannot reach the server. Please try again.";
    }

    const data = error.data as { message?: string } | undefined;
    return data?.message ?? fallback;
  }

  return error.message ?? fallback;
}