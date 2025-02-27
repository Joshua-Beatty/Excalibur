#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif

precision mediump float;
varying lowp vec4 v_color;

void main() {
  float r = 0.0, delta = 0.0, alpha = 1.0;
  vec2 cxy = 2.0 * gl_PointCoord - 1.0;
  r = dot(cxy, cxy);

#ifdef GL_OES_standard_derivatives
  delta = fwidth(r);
  alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
#else
  if (r > 1.0) {
    discard;
  }
#endif
  // "premultiply" the color by alpha
  vec4 color = v_color;
  color.a = color.a * alpha;
  color.rgb = color.rgb * color.a;
  gl_FragColor = color;
}