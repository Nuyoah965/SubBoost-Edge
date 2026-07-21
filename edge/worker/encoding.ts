function bytesToBinary(bytes: Uint8Array): string {
  const chunks: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)));
  }
  return chunks.join("");
}

export function utf8ToBase64(value: string): string {
  return btoa(bytesToBinary(new TextEncoder().encode(value)));
}

export function safeBase64Decode(value: string): string {
  if (!value) return "";
  let normalized = value.replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
  while (normalized.length % 4) normalized += "=";

  try {
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

export function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}
