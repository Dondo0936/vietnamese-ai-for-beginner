#!/usr/bin/env node
// Viettel AI TTS — Vietnamese text -> speech (mp3/wav).
// Spec (from Viettel docs): POST https://viettelai.vn/tts/speech_synthesis
//   body: { text, voice, speed(0.8-1.2), tts_return_option(2=wav,3=mp3), token, without_filter }
//   success -> raw audio bytes (request_id in header); failure -> JSON { code, vi_message, en_message }
// Token from https://viettelai.vn/dashboard/token. Read order:
//   1. process.env.VIETTEL_TTS_TOKEN
//   2. ai-edu-v2/.viettel-token  (gitignored)
// Default voice = hcm-minhquan (Minh Quân, Nam miền Nam = Southern male).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const ENDPOINT = "https://viettelai.vn/tts/speech_synthesis";

// Voice codes (https://viettelai.vn/tts/voices). Minh Quân (Southern male) is the default.
export const VOICES = {
  "hcm-minhquan": "Minh Quân — Nam miền Nam (default)",
  "hcm-phuongly": "Phương Ly — Nữ miền Nam",
  "hcm-diemmy": "Diễm My — Nữ miền Nam",
  "hn-thanhtung": "Thanh Tùng — Nam miền Bắc",
  "hue-baoquoc": "Bảo Quốc — Nam miền Trung",
};

export function viettelToken() {
  return (process.env.VIETTEL_TTS_TOKEN || readMaybe(path.join(ROOT, ".viettel-token")) || "").trim();
}

export async function viettelTTS({
  text,
  voice = "hcm-minhquan",
  speed = 1.0,
  format = "mp3",
  withoutFilter = false,
  token = viettelToken(),
} = {}) {
  if (!text) throw new Error("viettelTTS: missing text");
  if (!token) throw new Error("Missing Viettel token. Set VIETTEL_TTS_TOKEN or put it in ai-edu-v2/.viettel-token");
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "*/*" },
    body: JSON.stringify({
      text,
      voice,
      speed,
      tts_return_option: format === "wav" ? 2 : 3,
      token,
      without_filter: withoutFilter,
    }),
  });
  const ct = res.headers.get("content-type") || "";
  const buf = Buffer.from(await res.arrayBuffer());
  // Errors arrive as JSON; success is binary audio (mp3 ID3/0xFF, wav RIFF).
  if (!res.ok || ct.includes("json") || buf[0] === 0x7b /* '{' */) {
    throw new Error(`Viettel TTS failed (HTTP ${res.status}): ${buf.toString("utf8").slice(0, 400)}`);
  }
  return {
    audio: buf,
    contentType: ct,
    requestId: res.headers.get("request_id") || res.headers.get("request-id") || null,
  };
}

function readMaybe(p) {
  try { return fs.readFileSync(p, "utf8"); } catch { return null; }
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) continue;
    const k = argv[i].slice(2);
    const v = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
    o[k] = v;
  }
  return o;
}

// CLI: node scripts/tts-viettel.mjs --text "..." [--text-file f] --voice hcm-minhquan --speed 1.0 --out out.mp3
if (import.meta.url === `file://${process.argv[1]}`) {
  const a = parseArgs(process.argv.slice(2));
  const text = a.text || (a["text-file"] ? fs.readFileSync(a["text-file"], "utf8").trim() : null);
  if (!text) { console.error("Pass --text or --text-file"); process.exit(1); }
  const out = path.resolve(a.out || "viettel-out.mp3");
  try {
    const { audio, requestId } = await viettelTTS({
      text,
      voice: a.voice || "hcm-minhquan",
      speed: a.speed ? Number(a.speed) : 1.0,
      format: a.format || "mp3",
      withoutFilter: a["without-filter"] === "true",
    });
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, audio);
    const secs = (audio.length / (a.format === "wav" ? 44100 * 2 : 16000) ).toFixed(1); // rough only
    console.log(`OK -> ${out}  (${(audio.length / 1024).toFixed(0)}KB${requestId ? `, request_id=${requestId}` : ""})`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
