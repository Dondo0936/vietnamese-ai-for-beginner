"use client";

import { useRef } from "react";
import { useShaderCanvas } from "./useShaderCanvas";

/**
 * Dark-mode background: "gravity grid".
 *
 * A flat grid of glowing lines is pulled toward the cursor as if a heavy
 * object were resting on spacetime. We displace UVs by a radial well
 * (inverse-square softened with a plummer core), then draw grid lines by
 * measuring distance to the nearest integer on each axis.
 *
 * The accent teal (#20B8AE from the dark theme palette) tints line
 * intensity near the well to avoid a flat monochrome look.
 */
const FRAGMENT = /* glsl */ `
  precision highp float;

  uniform vec2  uResolution;
  uniform vec2  uMouse;
  uniform float uMouseStrength;
  uniform float uTime;

  // Tunables — shader-local, so no CSS custom-properties crossing.
  const float GRID_SIZE      = 26.0;  // cells across viewport width
  const float LINE_HALF      = 0.02;  // half-thickness in UV-cell space
  const float WELL_DEPTH     = 0.22;  // how far UVs are pulled toward mouse
  const float WELL_RADIUS    = 0.38;  // softness of gravity well in UV space

  // Background and accent (matches --bg-primary / --accent in dark theme).
  const vec3  BG_COLOR       = vec3(0.039, 0.039, 0.043);  // #0A0A0B
  const vec3  GRID_COLOR     = vec3(0.36, 0.38, 0.45);     // cool ink
  const vec3  ACCENT_COLOR   = vec3(0.125, 0.72, 0.68);    // #20B8AE

  // Smooth line via distance-to-grid in cell space.
  float gridLine(vec2 uv, float thickness) {
    vec2 grid = abs(fract(uv - 0.5) - 0.5) / fwidth(uv);
    float line = min(grid.x, grid.y);
    return 1.0 - smoothstep(thickness, thickness + 1.0, line);
  }

  void main() {
    // Aspect-correct UVs so the grid stays square on wide screens.
    vec2 uv = gl_FragCoord.xy / uResolution;
    float aspect = uResolution.x / uResolution.y;
    vec2 p = vec2(uv.x * aspect, uv.y);
    vec2 m = vec2(uMouse.x * aspect, uMouse.y);

    // Gravity well: pull UVs toward cursor. A plummer-style softened core
    // avoids the singularity at the exact cursor position.
    vec2  toMouse = m - p;
    float r2      = dot(toMouse, toMouse);
    float well    = WELL_DEPTH * uMouseStrength /
                    (1.0 + r2 / (WELL_RADIUS * WELL_RADIUS));
    vec2 warped = p - toMouse * well;

    // Idle drift so the grid never looks frozen before first mouse move.
    warped.x += sin(uTime * 0.18 + warped.y * 1.2) * 0.004;
    warped.y += cos(uTime * 0.22 + warped.x * 1.0) * 0.004;

    vec2 cellUv = warped * GRID_SIZE;
    float line  = gridLine(cellUv, LINE_HALF * GRID_SIZE);

    // Radial vignette so the edges feather into the background.
    float vignette = smoothstep(1.2, 0.25, length(uv - 0.5) * 1.6);

    // Accent bloom near the well — stronger when warping is stronger.
    float bloom = exp(-r2 * 8.0) * uMouseStrength;
    vec3 lineColor = mix(GRID_COLOR, ACCENT_COLOR, clamp(bloom * 1.4, 0.0, 1.0));

    vec3 color = BG_COLOR + lineColor * line * 0.55 * vignette;
    color += ACCENT_COLOR * bloom * 0.08;  // subtle rim light at cursor

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function GravityGrid({ reducedMotion }: { reducedMotion: boolean }) {
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
