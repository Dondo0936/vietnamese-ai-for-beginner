/**
 * Ed25519 public key for udemi.tech certificate verification.
 *
 * The matching private key lives in `UDEMI_CERT_PRIVATE_KEY` (Vercel env),
 * accessible only to `/api/certificates/issue`. Anyone in the world can
 * verify a cert's signature using this public key alone — no API call to
 * udemi required. That's the whole point of asymmetric signing.
 *
 * Format: PKCS#8 SPKI DER, base64-encoded.
 *
 * To rotate: generate a new keypair, set the new private key in env BEFORE
 * deploying, ship a new key_id ('udemi-cert-v2'), keep both public keys here
 * keyed by key_id, and verify against the cert's `key_id` column.
 */
export const CERT_KEY_ID = "udemi-cert-v1";

/**
 * Map of key_id -> base64-encoded Ed25519 public key (SPKI DER).
 * Add new entries when rotating; never delete old ones (would invalidate
 * historical certificates).
 */
export const CERT_PUBLIC_KEYS: Record<string, string> = {
  "udemi-cert-v1":
    "MCowBQYDK2VwAyEARfmJctcbxKlZDtW6g6viXk2S+Re118otCtwqcdjQD+E=",
};

export function getPublicKeyBytes(keyId: string): Uint8Array | null {
  const b64 = CERT_PUBLIC_KEYS[keyId];
  if (!b64) return null;
  return base64ToBytes(b64);
}

export function base64ToBytes(b64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(b64, "base64"));
  }
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
