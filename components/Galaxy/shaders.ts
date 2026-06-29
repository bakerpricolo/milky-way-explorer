export const vertexShader = /* glsl */ `
  attribute float a_size;
  attribute vec3  a_color;

  varying vec3  v_color;
  varying float v_alpha;

  uniform float u_pixelRatio;
  uniform float u_time;

  void main() {
    v_color = a_color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float depth = -mvPosition.z;
    float pointSize = a_size * u_pixelRatio * (280.0 / depth);
    pointSize = clamp(pointSize, 0.4, 7.0);
    v_alpha = smoothstep(0.4, 1.8, pointSize);
    gl_PointSize = pointSize;
    gl_Position  = projectionMatrix * mvPosition;
  }
`;

export const fragmentShader = /* glsl */ `
  varying vec3  v_color;
  varying float v_alpha;

  uniform float u_opacity;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float glow = pow(1.0 - smoothstep(0.0, 0.5, dist), 1.4);
    float core = 1.0 - smoothstep(0.0, 0.12, dist);
    vec3 finalColor = mix(v_color, vec3(1.0), core * 0.55);
    float alpha = glow * v_alpha * u_opacity;
    if (alpha < 0.005) discard;
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// ─── Gaia-star shaders (brighter, larger, time-aware) ─────────────────────────

export const gaiaVertexShader = /* glsl */ `
  attribute float a_size;
  attribute vec3  a_color;
  attribute float a_selected;
  attribute vec3  a_velocity;

  varying vec3  v_color;
  varying float v_alpha;
  varying float v_selected;

  uniform float u_pixelRatio;
  uniform float u_timeOffset;
  uniform float u_opacity;

  void main() {
    v_color    = a_color;
    v_selected = a_selected;

    vec3 displaced   = position + a_velocity * u_timeOffset;
    vec4 mvPosition  = modelViewMatrix * vec4(displaced, 1.0);
    float depth      = -mvPosition.z;
    float pointSize  = a_size * u_pixelRatio * (400.0 / depth);
    pointSize        = clamp(pointSize, 1.0, 18.0);

    if (a_selected > 0.5) pointSize = max(pointSize * 2.5, 10.0);

    v_alpha = (smoothstep(0.8, 2.5, pointSize) * 0.95 + 0.05) * u_opacity;
    gl_PointSize = pointSize;
    gl_Position  = projectionMatrix * mvPosition;
  }
`;

export const gaiaFragmentShader = /* glsl */ `
  varying vec3  v_color;
  varying float v_alpha;
  varying float v_selected;

  void main() {
    vec2  uv   = gl_PointCoord - 0.5;
    float dist = length(uv);
    if (dist > 0.5) discard;

    float glow = pow(1.0 - smoothstep(0.0, 0.5, dist), 1.2);
    float core = 1.0 - smoothstep(0.0, 0.15, dist);
    vec3 color = mix(v_color, vec3(1.0), core * 0.7);

    if (v_selected > 0.5) {
      float ring = abs(dist - 0.38);
      if (ring < 0.06) {
        color = mix(color, vec3(0.0, 0.85, 1.0), 1.0 - ring / 0.06);
      }
    }

    float alpha = glow * v_alpha;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;
