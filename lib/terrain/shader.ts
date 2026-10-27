import { DRIFT, INDEX_EVERY, LEVELS, SUMMIT, UNIT_PX, WATER } from "./field";

const f = (n: number) => (Number.isInteger(n) ? `${n}.0` : `${n}`);

export const VERTEX = /* glsl */ `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

/**
 * The map sheet: hillshade, water, contour lines (index every fifth), and the intro's raster
 * stage. Every position uniform is in CSS pixels from the top-left corner.
 */
export const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
precision highp int;

uniform vec2 uRes;       // device pixels
uniform float uScale;    // device pixels per CSS pixel
uniform vec2 uFix;       // the fix point, CSS px
uniform float uTime;     // drift clock, seconds
uniform float uZoom;     // 1 = rest, > 1 = closer
uniform float uScan;     // 0..1 of the screen revealed from the top
uniform float uPixel;    // raster cell size in CSS px (1 = none)
uniform float uVector;   // 0 = raster, 1 = vector contours
uniform uint uSeedA;     // the club's terrain
uniform uint uSeedB;     // a member's terrain
uniform float uSeedMix;  // 0 = club, 1 = member
uniform vec3 uSun;       // light direction (east, north, up)
uniform vec4 uBumps[4];  // fingers: x, y, strength, radius (CSS px)
uniform vec4 uRipple;    // x, y, age (s), amplitude
uniform float uSummit;   // 0..1 of the summit raised at the fix point
uniform vec2 uParallax;  // CSS px
uniform float uDim;      // 0..1

out vec4 outColor;

const float UNIT = ${f(UNIT_PX)};
const float LEVELS = ${f(LEVELS)};
const float INDEX_EVERY = ${f(INDEX_EVERY)};
const float WATER = ${f(WATER)};
const vec2 DRIFT = vec2(${f(DRIFT.x)}, ${f(DRIFT.y)});
const float SUMMIT_H = ${f(SUMMIT.height)};
const float SUMMIT_R = ${f(SUMMIT.radius)};

const vec3 PAPER = vec3(0.9137, 0.9333, 0.9059);
const vec3 SAGE = vec3(0.4980, 0.6039, 0.4863);
const vec3 SAGE_INDEX = vec3(0.3686, 0.4784, 0.3569);
const vec3 HYDRO = vec3(0.2471, 0.4549, 0.6392);

uint pcg(uint v) {
  uint s = v * 747796405u + 2891336453u;
  uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
  return (w >> 22u) ^ w;
}

float lattice(ivec2 q, uint seed) {
  return float(pcg(uint(q.x) * 1597334677u ^ pcg(uint(q.y) ^ seed))) * (1.0 / 4294967295.0);
}

float valueNoise(vec2 p, uint seed) {
  vec2 i = floor(p);
  vec2 fr = p - i;
  vec2 u = fr * fr * fr * (fr * (fr * 6.0 - 15.0) + 10.0);
  ivec2 q = ivec2(i);
  float a = lattice(q, seed);
  float b = lattice(q + ivec2(1, 0), seed);
  float c = lattice(q + ivec2(0, 1), seed);
  float d = lattice(q + ivec2(1, 1), seed);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p, uint seed) {
  float sum = 0.0;
  float amp = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    sum += amp * valueNoise(p, seed + uint(i) * 101u);
    p = r * p * 2.03 + vec2(17.1, 9.3);
    amp *= 0.5;
  }
  return sum / 0.96875;
}

float height(vec2 css) {
  vec2 u = (css - uFix + uParallax) / (UNIT * uZoom);
  float h;
  if (uSeedMix <= 0.0) {
    h = fbm(u + DRIFT * uTime, uSeedA);
  } else if (uSeedMix >= 1.0) {
    h = fbm(u, uSeedB);
  } else {
    h = mix(fbm(u + DRIFT * uTime, uSeedA), fbm(u, uSeedB), uSeedMix);
  }
  if (uSummit > 0.0) {
    vec2 s = (css - uFix) / (UNIT * uZoom);
    h += uSummit * SUMMIT_H * exp(-dot(s, s) / (SUMMIT_R * SUMMIT_R));
  }
  for (int i = 0; i < 4; i++) {
    vec4 b = uBumps[i];
    if (b.z > 0.0005) {
      vec2 d = css - b.xy;
      h += b.z * exp(-dot(d, d) / (b.w * b.w));
    }
  }
  if (uRipple.w > 0.0) {
    float d = length(css - uRipple.xy);
    float front = uRipple.z * 520.0;
    float x = (d - front) / 70.0;
    h += uRipple.w * exp(-x * x) * exp(-uRipple.z * 1.6) * sin((d - front) * 0.07);
  }
  return h;
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uScale;
  float viewH = uRes.y / uScale;

  if (frag.y > uScan * viewH) {
    outColor = vec4(PAPER * (1.0 - 0.08 * uDim), 1.0);
    return;
  }

  float cell = max(uPixel, 1.0);
  vec2 css = cell > 1.0 ? (floor(frag / cell) + 0.5) * cell : frag;
  float h = height(css);

  // Raster stage: classified cells, as a satellite image before vectorisation.
  float band = floor(h * LEVELS * 0.25);
  float tone = 0.05 + 0.11 * fract(band * 0.618);
  vec3 raster = h < WATER ? mix(PAPER, HYDRO, 0.18 + tone) : mix(PAPER, SAGE, tone * 2.0);
  if (cell > 1.5) {
    vec2 m = mod(frag, cell);
    raster *= 1.0 - 0.045 * max(step(cell - 1.0, m.x), step(cell - 1.0, m.y));
  }

  // Vector stage.
  vec3 col = PAPER;
  float fwH = fwidth(h);

  // Hillshade (x = east, y = north = up on screen, z = up).
  vec2 grad = vec2(dFdx(h), dFdy(h)) * uScale * UNIT;
  vec3 n = normalize(vec3(-grad * 0.32, 1.0));
  float lit = dot(n, uSun) - uSun.z;
  col *= 1.0 + clamp(lit, -0.5, 0.5) * 0.15;

  // Water: a pale wash and a shoreline.
  float wet = 1.0 - smoothstep(WATER - fwH, WATER + fwH, h);
  col = mix(col, HYDRO, wet * 0.11);
  float shore = abs(h - WATER) / max(fwH, 1e-5);
  float shoreLine = 1.0 - smoothstep(0.7 * uScale, 1.6 * uScale, shore);

  // Contours.
  float lv = h * LEVELS;
  float fw = max(fwidth(lv), 1e-5);
  float dist = abs(fract(lv + 0.5) - 0.5) / fw;
  float isIndex = mod(floor(lv + 0.5), INDEX_EVERY) == 0.0 ? 1.0 : 0.0;
  float halfWidth = mix(0.45, 0.85, isIndex) * uScale;
  float line = 1.0 - smoothstep(halfWidth - 0.5, halfWidth + 0.6, dist);
  line *= 1.0 - smoothstep(0.32, 0.75, fw);
  vec3 ink = mix(mix(SAGE, SAGE_INDEX, isIndex), HYDRO, wet);
  float strength = mix(mix(0.42, 0.78, isIndex), 0.3, wet);
  col = mix(col, ink, line * strength);
  col = mix(col, HYDRO, shoreLine * 0.55);

  col = mix(raster, col, uVector);
  col *= 1.0 - 0.08 * uDim;
  outColor = vec4(col, 1.0);
}
`;
