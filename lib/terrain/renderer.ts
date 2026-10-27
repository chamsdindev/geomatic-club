import { FRAGMENT, VERTEX } from "./shader";
import { emitFrame, terrain } from "./state";

const UNIFORMS = [
  "uRes", "uScale", "uFix", "uTime", "uZoom", "uScan", "uPixel", "uVector", "uSeedA", "uSeedB",
  "uSeedMix", "uSun", "uBumps", "uRipple", "uSummit", "uParallax", "uDim",
] as const;
type UniformName = (typeof UNIFORMS)[number];

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(log ?? "compile");
  }
  return shader;
}

/**
 * Draws the terrain into a full-screen canvas. Full frame rate while something moves (an
 * animation, a finger, a ripple), every other frame while the map only breathes, nothing while
 * the tab is hidden. If frames run long, the canvas resolution steps down (never below half).
 */
export class TerrainRenderer {
  private raf = 0;
  private last = 0;
  private frameCount = 0;
  private quality = 1;
  private slowFrames = 0;
  private measured = 0;
  private readonly loc: Record<UniformName, WebGLUniformLocation | null>;
  private readonly bumpData = new Float32Array(16);

  private constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly gl: WebGL2RenderingContext,
    program: WebGLProgram,
  ) {
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    this.loc = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(program, n)])) as Record<
      UniformName,
      WebGLUniformLocation | null
    >;
  }

  static create(canvas: HTMLCanvasElement): TerrainRenderer | null {
    try {
      const gl = canvas.getContext("webgl2", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "low-power",
      });
      if (!gl) return null;
      const program = gl.createProgram();
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
      return new TerrainRenderer(canvas, gl, program);
    } catch {
      return null;
    }
  }

  resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2) * this.quality;
    const w = Math.max(1, Math.round(this.canvas.clientWidth * ratio));
    const h = Math.max(1, Math.round(this.canvas.clientHeight * ratio));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
    }
    terrain.dirty = true;
  }

  start() {
    if (this.raf) return;
    this.last = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private tick = (now: number) => {
    this.raf = requestAnimationFrame(this.tick);
    const dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 0;
    this.last = now;
    const t = terrain;

    let fingers = false;
    for (const b of t.bumps) {
      if (b.target > 0) b.s += (b.target - b.s) * Math.min(1, dt * 9);
      else if (b.s > 0) b.s = b.s * Math.exp(-dt * 3.2) - 0.0004;
      if (b.s < 0) b.s = 0;
      if (b.s > 0) fingers = true;
    }
    const rippling = t.ripple.amplitude > 0 && t.ripple.start >= 0 && now - t.ripple.start < 2600;
    if (t.ripple.amplitude > 0 && !rippling && t.ripple.start >= 0) t.ripple.amplitude = 0;

    if (!t.frozen && !t.still) t.clock += dt;
    emitFrame(now);

    const active = now < t.activeUntil || fingers || rippling;
    const draw = t.still ? t.dirty : active || this.frameCount++ % 2 === 0;
    if (!draw) return;
    this.render(now);
    t.dirty = false;

    if (active && dt > 0) this.adapt(dt);
  };

  /** Over 45 busy frames, if most of them took longer than 24 ms, draw fewer pixels. */
  private adapt(dt: number) {
    this.measured++;
    if (dt > 0.024) this.slowFrames++;
    if (this.measured < 45) return;
    if (this.slowFrames > 30 && this.quality > 0.5) {
      this.quality = Math.max(0.5, this.quality * 0.85);
      this.resize();
    }
    this.measured = 0;
    this.slowFrames = 0;
  }

  render(now = performance.now()) {
    const { gl, loc } = this;
    const t = terrain;
    const scale = this.canvas.width / Math.max(1, this.canvas.clientWidth);
    gl.uniform2f(loc.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(loc.uScale, scale);
    gl.uniform2f(loc.uFix, t.fix.x, t.fix.y);
    gl.uniform1f(loc.uTime, t.clock);
    gl.uniform1f(loc.uZoom, t.zoom);
    gl.uniform1f(loc.uScan, t.scan);
    gl.uniform1f(loc.uPixel, t.pixel);
    gl.uniform1f(loc.uVector, t.vector);
    gl.uniform1ui(loc.uSeedA, t.seedA >>> 0);
    gl.uniform1ui(loc.uSeedB, t.seedB >>> 0);
    gl.uniform1f(loc.uSeedMix, t.seedMix);
    const az = (t.sun.azimuth * Math.PI) / 180;
    const alt = (t.sun.altitude * Math.PI) / 180;
    gl.uniform3f(loc.uSun, Math.sin(az) * Math.cos(alt), Math.cos(az) * Math.cos(alt), Math.sin(alt));
    t.bumps.forEach((b, i) => this.bumpData.set([b.x, b.y, b.s, b.r], i * 4));
    gl.uniform4fv(loc.uBumps, this.bumpData);
    const age = t.ripple.start >= 0 ? (now - t.ripple.start) / 1000 : 0;
    gl.uniform4f(loc.uRipple, t.ripple.x, t.ripple.y, age, t.ripple.amplitude);
    gl.uniform1f(loc.uSummit, t.summit);
    gl.uniform2f(loc.uParallax, t.parallax.x, t.parallax.y);
    gl.uniform1f(loc.uDim, t.dim);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
