"use client";

import { useEffect, useRef } from "react";

/**
 * Shared raw-WebGL bootstrap for homepage shaders.
 *
 * Raw WebGL (rather than three.js / R3F / ogl) is deliberate:
 * - Zero new deps → no bundle-size hit.
 * - Fullscreen fragment shaders need no scene graph; one triangle is enough.
 * - ~120 LOC total, trivially tree-shaken.
 *
 * Contract:
 *  - Accepts a GLSL fragment source. The vertex shader is a canonical
 *    fullscreen triangle.
 *  - Provides these uniforms by default:
 *      uniform vec2  uResolution;  // pixels (DPR-aware)
 *      uniform vec2  uMouse;       // 0..1, y-up (flipped from DOM y-down)
 *      uniform float uMouseStrength; // 0..1, decays when cursor leaves
 *      uniform float uTime;        // seconds since mount
 *  - Pauses the rAF loop when the tab is hidden, resumes on focus.
 *  - Cleans up GL context and listeners on unmount (works across route changes).
 */
export interface ShaderOptions {
  fragmentShader: string;
  /** Disable the animation loop (for prefers-reduced-motion). Renders once. */
  staticRender?: boolean;
  /** Optional extra uniforms to set each frame, keyed by uniform name. */
  extraUniforms?: Record<string, number | [number, number] | [number, number, number]>;
}

const VERTEX_SHADER = `
  attribute vec2 aPosition;
  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[shader] compile failed:", gl.getShaderInfoLog(shader));
    }
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function useShaderCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  { fragmentShader, staticRender, extraUniforms }: ShaderOptions
) {
  // Track the live fragment shader so theme changes can swap it without remount.
  const fragRef = useRef(fragmentShader);
  fragRef.current = fragmentShader;

  const extraRef = useRef(extraUniforms);
  extraRef.current = extraUniforms;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext("webgl", { antialias: true, premultipliedAlpha: true, alpha: true }) ??
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return;

    // Compile once; we rebuild on fragment-source change via the deps array.
    const vert = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const frag = compile(gl, gl.FRAGMENT_SHADER, fragmentShader);
    if (!vert || !frag) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    // Fullscreen triangle: covers the viewport with a single draw call.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uMouse = gl.getUniformLocation(program, "uMouse");
    const uMouseStrength = gl.getUniformLocation(program, "uMouseStrength");
    const uTime = gl.getUniformLocation(program, "uTime");

    const extraLocations = new Map<string, WebGLUniformLocation | null>();
    if (extraRef.current) {
      for (const name of Object.keys(extraRef.current)) {
        extraLocations.set(name, gl.getUniformLocation(program, name));
      }
    }

    // State ---------------------------------------------------------------
    // Target mouse (raw input) and eased mouse (what the shader sees) keep
    // the visual response smooth at 60fps regardless of pointermove firing rate.
    const mouse = { x: 0.5, y: 0.5 };
    const target = { x: 0.5, y: 0.5 };
    let strength = 0;
    let targetStrength = 0;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    // Pointermove covers mouse + pen + touch-drag with a single listener.
    // We do not sample per-event — rAF pulls the latest value, which is
    // the recommended throttle pattern (see Google "Debounce your input handlers").
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      target.x = (e.clientX - rect.left) / rect.width;
      target.y = 1 - (e.clientY - rect.top) / rect.height; // GL is y-up
      targetStrength = 1;
    };
    const onPointerLeave = () => {
      targetStrength = 0;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave, { passive: true });

    // Tab-visibility pause — saves battery and stops layout thrash in background.
    let paused = document.hidden;
    const onVisibility = () => {
      paused = document.hidden;
      if (!paused && !staticRender) {
        start = performance.now() - elapsed;
        loop();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    let rafId = 0;
    let start = performance.now();
    let elapsed = 0;

    const draw = (t: number) => {
      elapsed = t - start;

      // Exponential smoothing (~0.08 per frame ≈ 150ms to reach 90%).
      mouse.x += (target.x - mouse.x) * 0.08;
      mouse.y += (target.y - mouse.y) * 0.08;
      strength += (targetStrength - strength) * 0.06;

      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uMouseStrength, strength);
      gl.uniform1f(uTime, elapsed / 1000);

      if (extraRef.current) {
        for (const [name, value] of Object.entries(extraRef.current)) {
          const loc = extraLocations.get(name);
          if (!loc) continue;
          if (typeof value === "number") gl.uniform1f(loc, value);
          else if (value.length === 2) gl.uniform2f(loc, value[0], value[1]);
          else if (value.length === 3) gl.uniform3f(loc, value[0], value[1], value[2]);
        }
      }

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = () => {
      if (paused) return;
      rafId = requestAnimationFrame(loop);
      draw(performance.now());
    };

    if (staticRender) {
      draw(performance.now());
    } else {
      loop();
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      // Best-effort context loss: frees GPU memory immediately on route change.
      const lose = gl.getExtension("WEBGL_lose_context");
      lose?.loseContext();
    };
  }, [canvasRef, fragmentShader, staticRender]);
}
