"use client";

import { useRef } from "react";
import { useShaderCanvas } from "./useShaderCanvas";

/**
 * Light-mode background: "cell bloom".
 *
 * Voronoi cells drift slowly across the viewport. Cells closer to the
 * cursor brighten and swell — the "petri-dish reacting to warmth" brief.
 *
 * Implementation: 2D Worley noise (standard f1 / f2 distance fields),
 * with cell centers jittered by a deterministic hash. Warmth is just a
 * radial mask around the mouse that boosts cell brightness + saturation.
 */
const FRAGMENT = /* glsl */ `
  precision highp float;

  uniform vec2  uResolution;
  uniform vec2  uMouse;
  uniform float uMouseStrength;
  uniform float uTime;

  // Palette: Perplexity paper tones from globals.css light theme.
  const vec3 BG_TOP    = vec3(0.984, 0.969, 0.949);   // #FBF7F2
  const vec3 BG_WARM   = vec3(0.956, 0.933, 0.890);   // #F4EEE3
  const vec3 ACCENT    = vec3(0.059, 0.541, 0.514);   // #0F8A83
  const vec3 EDGE      = vec3(0.10,  0.10,  0.11);    // near-black for line art

  const float CELL_DENSITY = 5.5;    // number of cells across the shorter axis
  const float EDGE_WIDTH   = 0.018;  // thickness of Voronoi boundary
  const float WARMTH_RADIUS = 0.28;  // how far bloom reaches (in UV space)

  // 2D hash — GLSL-ES friendly, deterministic per integer cell coord.
  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)),
             dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453) * 2.0 - 1.0;
  }

  // Worley: returns (f1, f2) — distances to nearest and second-nearest.
  vec2 worley(vec2 uv) {
    vec2 iUv = floor(uv);
    vec2 fUv = fract(uv);
    float f1 = 8.0, f2 = 8.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 cell = vec2(float(x), float(y));
        vec2 center = 0.5 + 0.5 * sin(uTime * 0.35 + 6.2831 * hash2(iUv + cell));
        vec2 r = cell + center - fUv;
        float d = dot(r, r);
        if (d < f1) { f2 = f1; f1 = d; }
        else if (d < f2) { f2 = d; }
      }
    }
    return vec2(sqrt(f1), sqrt(f2));
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    float aspect = uResolution.x / uResolution.y;
    vec2 p = vec2(uv.x * aspect, uv.y) * CELL_DENSITY;

    vec2 w = worley(p);
    // f2 - f1 peaks at cell boundaries → use as edge mask.
    float edge = smoothstep(EDGE_WIDTH + 0.02, EDGE_WIDTH, w.y - w.x);

    // Warmth mask: distance from cursor in UV space.
    vec2 m = uMouse;
    float d = distance(uv, m);
    float warmth = smoothstep(WARMTH_RADIUS, 0.0, d) * uMouseStrength;

    // Base: paper gradient — slightly warmer at bottom.
    vec3 bg = mix(BG_TOP, BG_WARM, uv.y * 0.6 + 0.2);

    // Interior tint — subtle accent wash that intensifies near cursor.
    float interior = 1.0 - smoothstep(0.0, 0.4, w.x);
    vec3 cellTint = mix(bg, mix(bg, ACCENT, 0.12), interior * (0.25 + warmth * 0.9));

    // Draw edges as soft ink lines, darker and slightly thicker in bloom zone.
    float edgeStrength = 0.20 + warmth * 0.35;
    vec3 color = mix(cellTint, EDGE, edge * edgeStrength);

    // Accent halo around cursor itself — gentle, never clips to solid.
    color = mix(color, mix(color, ACCENT, 0.22), warmth * warmth);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function CellBloom({ reducedMotion }: { reducedMotion: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useShaderCanvas(canvasRef, {
    fragmentShader: FRAGMENT,
    staticRender: reducedMotion,
  });
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="block h-full w-full"
      style={{ display: "block" }}
    />
  );
}
