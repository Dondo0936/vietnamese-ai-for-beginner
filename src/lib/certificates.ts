/**
 * Certificate domain library.
 *
 * Three responsibilities:
 *   1. canonical payload construction + serialization
 *   2. Ed25519 sign / verify (Web Crypto API, runs in Edge + Node + browser)
 *   3. Vietnamese-aware display-name similarity check at claim time
 */

import type { AdultPathId } from "./paths";
import {
  CERT_KEY_ID,
  base64ToBytes,
  bytesToBase64,
  getPublicKeyBytes,
} from "./cert-keys";

export interface CertPayload {
  v: 1;
  certId: string;
  userId: string;
  pathId: AdultPathId;
  pathName: string;
  fullName: string;
  lessonCount: number;
  hoursSeconds: number;
  quizAvg: number;
  completedAt: string;
  signedAt: string;
  keyId: string;
}

export interface CertRow {
  id: string;
  user_id: string;
  path_id: AdultPathId;
  path_name: string;
  lesson_count: number;
  hours_seconds: number;
  quiz_avg: number;
  full_name: string;
  auth_name: string | null;
  auth_email: string | null;
  completed_at: string;
  payload: CertPayload;
  signature: string;
  signed_at: string;
  key_id: string;
  public: boolean;
  revoked_at: string | null;
}

/* ─────────────────────────────────────────────────────────────
 * Canonical serialization
 *
 * The signed bytes are exactly the UTF-8 encoding of
 * canonicalJson(payload). Always reconstruct via the same path
 * before verifying: a stray whitespace difference would invalidate.
 * ──────────────────────────────────────────────────────────── */

const PAYLOAD_KEY_ORDER: (keyof CertPayload)[] = [
  "v",
  "certId",
  "userId",
  "pathId",
  "pathName",
  "fullName",
  "lessonCount",
  "hoursSeconds",
  "quizAvg",
  "completedAt",
  "signedAt",
  "keyId",
];

export function canonicalJson(payload: CertPayload): string {
  const ordered: Record<string, unknown> = {};
  for (const k of PAYLOAD_KEY_ORDER) {
    ordered[k] = payload[k];
  }
  return JSON.stringify(ordered);
}

/* ─────────────────────────────────────────────────────────────
 * Ed25519 sign / verify (Web Crypto API).
 *
 * Node 22 Edge runtime supports Ed25519 directly. Older runtimes do not.
 * In the Edge runtime this works without any extra import.
 * ──────────────────────────────────────────────────────────── */

async function importPrivateKey(pkcs8Der: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "pkcs8",
    bytesToArrayBuffer(pkcs8Der),
    { name: "Ed25519" },
    false,
    ["sign"],
  );
}

async function importPublicKey(spkiDer: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "spki",
    bytesToArrayBuffer(spkiDer),
    { name: "Ed25519" },
    false,
    ["verify"],
  );
}

export async function signPayload(
  payload: CertPayload,
  privateKeyBase64: string,
): Promise<string> {
  const key = await importPrivateKey(base64ToBytes(privateKeyBase64));
  const message = new TextEncoder().encode(canonicalJson(payload));
  const sig = await crypto.subtle.sign(
    "Ed25519",
    key,
    bytesToArrayBuffer(message),
  );
  return bytesToBase64(new Uint8Array(sig));
}

export async function verifyPayload(
  payload: CertPayload,
  signatureBase64: string,
): Promise<boolean> {
  const pubBytes = getPublicKeyBytes(payload.keyId);
  if (!pubBytes) return false;
  const key = await importPublicKey(pubBytes);
  const message = new TextEncoder().encode(canonicalJson(payload));
  const sigBytes = base64ToBytes(signatureBase64);
  return crypto.subtle.verify(
    "Ed25519",
    key,
    bytesToArrayBuffer(sigBytes),
    bytesToArrayBuffer(message),
  );
}

function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(out).set(bytes);
  return out;
}

/* ─────────────────────────────────────────────────────────────
 * Display-name similarity check
 *
 * The user picks "Tên muốn hiện ở Chứng chỉ?" — we let them differ
 * from their OAuth name in case (e.g. legal name vs. preferred name)
 * but require ≥ MIN_TOKEN_OVERLAP word tokens of length ≥ 2 to match
 * after lowercasing + diacritic stripping.
 *
 * "Lê Hoàng Anh"  vs  "hoàng anh lê"   → 3 overlap (lowered/stripped)
 * "Pham Trang"    vs  "Phạm Thị Trang" → 2 overlap (pham, trang)
 * ──────────────────────────────────────────────────────────── */

export const MIN_TOKEN_OVERLAP = 4;

export function tokenize(name: string): string[] {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining marks (incl. VN diacritics)
    .replace(/[đĐ]/g, "d") // đ doesn't decompose; map to d
    .toLowerCase()
    .split(/[\s\-_.,/]+/u)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

export interface NameSimilarityResult {
  ok: boolean;
  authTokens: string[];
  displayTokens: string[];
  matched: string[];
  needed: number;
}

export function checkNameSimilarity(
  authName: string,
  displayName: string,
  minOverlap: number = MIN_TOKEN_OVERLAP,
): NameSimilarityResult {
  const authTokens = tokenize(authName);
  const displayTokens = tokenize(displayName);
  const authSet = new Set(authTokens);
  const matched = Array.from(new Set(displayTokens.filter((t) => authSet.has(t))));

  // If either name has fewer tokens than the threshold, allow when ALL of
  // the shorter set's tokens match. ("Trang" vs "Phạm Trang" → 1 token, 1
  // matched, ok.) This avoids penalising people with mononyms.
  const shorter = Math.min(authTokens.length, displayTokens.length);
  const needed = Math.min(minOverlap, shorter);

  return {
    ok: matched.length >= needed,
    authTokens,
    displayTokens,
    matched,
    needed,
  };
}

/* ─────────────────────────────────────────────────────────────
 * Payload construction helper.
 * ──────────────────────────────────────────────────────────── */

export function buildPayload(args: {
  certId: string;
  userId: string;
  pathId: AdultPathId;
  pathName: string;
  fullName: string;
  lessonCount: number;
  hoursSeconds: number;
  quizAvg: number;
  completedAt: Date;
  signedAt?: Date;
}): CertPayload {
  return {
    v: 1,
    certId: args.certId,
    userId: args.userId,
    pathId: args.pathId,
    pathName: args.pathName,
    fullName: args.fullName,
    lessonCount: args.lessonCount,
    hoursSeconds: args.hoursSeconds,
    quizAvg: Number(args.quizAvg.toFixed(2)),
    completedAt: args.completedAt.toISOString(),
    signedAt: (args.signedAt ?? new Date()).toISOString(),
    keyId: CERT_KEY_ID,
  };
}

/* ─────────────────────────────────────────────────────────────
 * UI helpers
 * ──────────────────────────────────────────────────────────── */

export function formatHours(hoursSeconds: number): string {
  const totalMin = Math.round(hoursSeconds / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
}

export function formatVietnameseDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${day} tháng ${month}, ${year}`;
}

export function shortCertId(certId: string): string {
  // `UDM-` prefix + first 4 chars of uuid uppercased — for the diploma's
  // visible ID badge. The full UUID stays in the URL.
  return `UDM-${certId.replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}
