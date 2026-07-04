import "server-only";
import { UTApi } from "uploadthing/server";

let _api: UTApi | null = null;
function api(): UTApi {
  if (!_api) _api = new UTApi();
  return _api;
}

/** Uploader et logo til Uploadthing og returnerer den offentlige URL. */
export async function uploadLogoFile(file: File): Promise<string> {
  const res = await api().uploadFiles(file);
  if (res.error || !res.data) {
    throw new Error(res.error?.message ?? "Upload fejlede.");
  }
  return res.data.ufsUrl ?? res.data.url;
}
