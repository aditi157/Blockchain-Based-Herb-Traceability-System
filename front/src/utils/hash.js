export async function generateHash(data) {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);

  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}