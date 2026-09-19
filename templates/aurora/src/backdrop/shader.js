/**
 * A fullscreen aurora, as a single fragment shader.
 *
 * This is deliberately raw WebGL2 rather than three.js. What the effect
 * actually needs is one quad and one fragment shader; three.js would cost
 * ~170KB gzipped to draw it, which is most of this template's budget spent on
 * a decorative backdrop.
 */

export const VERTEX_SHADER = /* glsl */ `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;

uniform vec2  uResolution;
uniform float uTime;
uniform vec3  uAccent;

out vec4 fragColor;

// Classic value noise. Cheap, and at this scale indistinguishable from
// anything more expensive once it is behind a vignette.
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float total = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    total += noise(p) * amplitude;
    p *= 2.02;
    amplitude *= 0.5;
  }
  return total;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);

  float t = uTime * 0.045;

  // Two drifting noise fields, offset so the ribbons never quite repeat.
  float ribbon = fbm(vec2(p.x * 1.6 + t, p.y * 2.4 - t * 0.6));
  float drift  = fbm(vec2(p.x * 2.3 - t * 0.8, p.y * 1.1 + t * 0.4));

  float veil = smoothstep(0.25, 0.95, ribbon * 0.65 + drift * 0.55);

  // A soft bloom anchored slightly above centre, which is where the hero
  // headline sits. It reads as light behind the type rather than a shape.
  float bloom = 1.0 - smoothstep(0.0, 0.85, length(p - vec2(0.0, 0.08)));
  bloom = pow(bloom, 2.2);

  vec3 deep = vec3(0.019, 0.019, 0.027);
  vec3 glow = uAccent;

  vec3 color = deep;
  color += glow * veil * 0.20;
  color += glow * bloom * 0.34;

  // Vignette, so the content above always has somewhere quiet to sit.
  float vignette = 1.0 - smoothstep(0.35, 1.15, length(p));
  color *= mix(0.45, 1.0, vignette);

  // Dithering. Without it a gradient this dark bands visibly on 8-bit panels.
  float dither = (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  color += dither;

  fragColor = vec4(color, 1.0);
}
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * Builds the program and returns a render function, or null if anything at all
 * is unavailable. Never throws and never logs: a machine without WebGL gets
 * the CSS fallback, and a console error on someone's portfolio is a defect
 * whatever caused it.
 */
export function createAurora(canvas, accent) {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
    failIfMajorPerformanceCaveat: true,
  });
  if (!gl) return null;

  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vertex || !fragment) return null;

  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  const position = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(program, 'uResolution');
  const uTime = gl.getUniformLocation(program, 'uTime');
  const uAccent = gl.getUniformLocation(program, 'uAccent');
  gl.uniform3f(uAccent, accent[0], accent[1], accent[2]);

  return {
    resize(width, height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uResolution, width, height);
    },
    render(seconds) {
      gl.uniform1f(uTime, seconds);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      const lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    },
  };
}

/** '#7b61ff' -> [0.482, 0.380, 1.0] */
export function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const value = Number.parseInt(full, 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}
