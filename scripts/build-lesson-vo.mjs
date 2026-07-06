#!/usr/bin/env node
// Build voiceover + caption timeline for a lesson video.
//   1. TTS the narration once (Viettel, Minh Quân) -> public/lesson-<slug>-vo.mp3
//   2. Split the narration into short caption lines
//   3. Time each line by Vietnamese syllable weight (each whitespace token ≈ 1 syllable),
//      distributed across the real audio duration — no whisper/ML needed.
//   4. Write remotion/captions/<slug>.json  (imported by the Lesson*Narrated/Vertical comps)
//
// Usage: node scripts/build-lesson-vo.mjs --slug tokenization --narration <path-to-vi-txt>
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { viettelTTS } from "./tts-viettel.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const FPS = 30;
const BITRATE = 64000; // Viettel mp3 is CBR 64kbps
const MAXLEN = 56; // max chars per caption line (wraps to <=2 lines on vertical)

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

const slug = arg("slug", "tokenization");
const narrationPath = arg(
  "narration",
  "/Users/datdo/Projects/skill-marketplaces/copy/narration/" + slug + ".vi.txt",
);

const raw = fs.readFileSync(narrationPath, "utf8").trim();
const ttsText = raw.replace(/\s*\n\s*/g, " ").replace(/\s{2,}/g, " ").trim();

// ---- caption lines ----------------------------------------------------------
function splitSentences(t) {
  return t.match(/[^.?!]+[.?!]?/g).map((s) => s.trim()).filter(Boolean);
}
function splitLong(sentence) {
  if (sentence.length <= MAXLEN) return [sentence];
  const parts = sentence.split(/,\s*/);
  const lines = [];
  let cur = "";
  for (let i = 0; i < parts.length; i++) {
    const piece = parts[i] + (i < parts.length - 1 ? "," : "");
    if (cur && (cur + " " + piece).length > MAXLEN) { lines.push(cur); cur = piece; }
    else cur = cur ? cur + " " + piece : piece;
  }
  if (cur) lines.push(cur);
  return lines;
}
const lines = splitSentences(ttsText).flatMap(splitLong).map((s) => s.trim());

// ---- weights (syllable count + pause bonus) ---------------------------------
function syllables(line) {
  return (line.match(/\S+/g) || []).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}
const weights = lines.map((l) => syllables(l) + (/[.?!]$/.test(l) ? 2 : 0.6));
const totalWeight = weights.reduce((a, b) => a + b, 0);

// ---- synthesize + measure ---------------------------------------------------
const { audio } = await viettelTTS({ text: ttsText, voice: "hcm-minhquan", speed: 1.0, format: "mp3" });
const outMp3 = path.join(ROOT, "public", `lesson-${slug}-vo.mp3`);
fs.mkdirSync(path.dirname(outMp3), { recursive: true });
fs.writeFileSync(outMp3, audio);

// duration: strip an ID3v2 header if present, then CBR bytes -> seconds
let audioBytes = audio.length;
if (audio.slice(0, 3).toString("latin1") === "ID3") {
  const sz = ((audio[6] & 0x7f) << 21) | ((audio[7] & 0x7f) << 14) | ((audio[8] & 0x7f) << 7) | (audio[9] & 0x7f);
  audioBytes -= sz + 10;
}
const audioDurationSec = (audioBytes * 8) / BITRATE;

// ---- timeline ---------------------------------------------------------------
let acc = 0;
const timed = lines.map((text, i) => {
  const startSec = (acc / totalWeight) * audioDurationSec;
  acc += weights[i];
  const endSec = (acc / totalWeight) * audioDurationSec;
  return { text, startFrame: Math.round(startSec * FPS), endFrame: Math.round(endSec * FPS) };
});

const durationInFrames = Math.max(
  Math.round(audioDurationSec * FPS) + 14, // tail pad
  timed[timed.length - 1].endFrame + 6,
);

const data = {
  slug,
  audio: `lesson-${slug}-vo.mp3`,
  fps: FPS,
  audioDurationSec: Number(audioDurationSec.toFixed(2)),
  durationInFrames,
  lines: timed,
};
const outJson = path.join(ROOT, "remotion", "captions", `${slug}.json`);
fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify(data, null, 2));

console.log(`VO  -> ${outMp3}  (${(audio.length / 1024).toFixed(0)}KB, ~${audioDurationSec.toFixed(1)}s)`);
console.log(`JSON-> ${outJson}  (${timed.length} caption lines, ${durationInFrames} frames)`);
for (const l of timed) console.log(`  [${(l.startFrame / FPS).toFixed(1)}-${(l.endFrame / FPS).toFixed(1)}s] ${l.text}`);
