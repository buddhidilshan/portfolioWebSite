/**
 * A lightweight 2.5D portrait renderer. This is NOT a rigged 3D model.
 * A single textured mesh bends locally around the head and neck, retaining
 * the original artwork without the cut-out seams of a separate head image.
 * The desk/laptop remain anchored. Cards are independent live HTML elements.
 * No Three.js, remote service, face recognition, or camera access is used.
 */
/** CPU counterpart of the vertex shader, also used by the no-WebGL fallback. */
export function warpPortraitPoint(u, v, x, y, seconds, idle, settings = {}) {
  const smooth = (a, b, n) => { const t = Math.max(0, Math.min(1, (n - a) / (b - a))); return t * t * (3 - 2 * t); };
  const falloff = (r, a, b) => 1 - smooth(a, b, r);
  let head = falloff(Math.hypot((u - .646) / .102, (v - .230) / .198), .68, 1.37);
  head *= 1 - smooth(.40, .53, v);
  const face = falloff(Math.hypot((u - .646) / .071, (v - .270) / .133), .1, 1);
  const angle = x * (settings.headTilt ?? .018), qx = u - .657, qy = v - .425;
  const dx = qx * Math.cos(angle) - qy * Math.sin(angle) - qx + x * (settings.headTravel ?? .006) + face * x * .004;
  const dy = qx * Math.sin(angle) + qy * Math.cos(angle) - qy + y * (settings.nodTravel ?? .008) + face * y * .0018;
  let torso = falloff(Math.hypot((u - .670) / .195, (v - .46) / .25), .2, 1);
  torso *= 1 - smooth(.56, .60, v);
  return { x: u + dx * head, y: v + dy * head + Math.sin(seconds * 1.05) * .0015 * torso * idle };
}

/**
 * Canvas 2D textured mesh fallback for browsers with WebGL disabled.
 * Only the head/shoulder region is redrawn as a mesh; the desk stays fixed.
 * Capped at 30 fps / DPR 1.5 to keep the CPU fallback restrained.
 */
function createCanvasPortraitRenderer(canvas, imageSrc, settings) {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) { settings.onFallback?.(); return { draw() {}, destroy() {} }; }
  canvas.dataset.renderer = 'canvas2d';
  let ready = false, disposed = false, last = [0, 0, 0, 0], lastDraw = -1000;
  const image = new Image();
  const nx = 24, ny = 28, u0 = .46, u1 = .88, v1 = .615;
  const grid = [];
  for (let row = 0; row <= ny; row++) for (let col = 0; col <= nx; col++) {
    grid.push({ u: u0 + (u1 - u0) * col / nx, v: v1 * row / ny });
  }
  function triangle(a, b, c) {
    const x1 = b.sx - a.sx, y1 = b.sy - a.sy, x2 = c.sx - a.sx, y2 = c.sy - a.sy;
    const X1 = b.dx - a.dx, Y1 = b.dy - a.dy, X2 = c.dx - a.dx, Y2 = c.dy - a.dy;
    const det = x1 * y2 - x2 * y1;
    if (Math.abs(det) < 1e-8) return;
    const ma = (X1 * y2 - X2 * y1) / det, mc = (x1 * X2 - x2 * X1) / det;
    const mb = (Y1 * y2 - Y2 * y1) / det, md = (x1 * Y2 - x2 * Y1) / det;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(a.dx, a.dy); ctx.lineTo(b.dx, b.dy); ctx.lineTo(c.dx, c.dy); ctx.closePath(); ctx.clip();
    ctx.setTransform(ma, mb, mc, md, a.dx - ma * a.sx - mc * a.sy, a.dy - mb * a.sx - md * a.sy);
    ctx.drawImage(image, 0, 0);
    ctx.restore();
  }
  function draw(x = 0, y = 0, seconds = 0, idle = 0) {
    last = [x, y, seconds, idle];
    if (!ready || disposed) return;
    const now = performance.now();
    if (seconds !== 0 && now - lastDraw < 32) return;
    lastDraw = now;
    const width = canvas.width, height = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    if (Math.abs(x) + Math.abs(y) + Math.abs(idle) > 1e-5) {
      const vertices = grid.map(({ u, v }) => {
        const point = warpPortraitPoint(u, v, x, y, seconds, idle, settings);
        return { sx: u * image.naturalWidth, sy: v * image.naturalHeight, dx: point.x * width, dy: point.y * height };
      });
      for (let row = 0; row < ny; row++) for (let col = 0; col < nx; col++) {
        const a = row * (nx + 1) + col, b = a + 1, c = a + nx + 1, d = c + 1;
        triangle(vertices[a], vertices[b], vertices[c]); triangle(vertices[c], vertices[b], vertices[d]);
      }
    }
    canvas.dataset.poseX = x.toFixed(3); canvas.dataset.poseY = y.toFixed(3);
  }
  function resize() {
    if (disposed) return;
    const r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr));
    lastDraw = -1000; draw(...last);
  }
  image.onload = () => { if (disposed) return; ready = true; resize(); canvas.dataset.ready = 'true'; settings.onReady?.(); };
  image.onerror = () => settings.onFallback?.();
  image.src = imageSrc;
  const observer = new ResizeObserver(resize); observer.observe(canvas);
  return {
    draw,
    destroy() { disposed = true; image.onload = null; image.onerror = null; observer.disconnect(); },
  };
}

export function createPortraitRenderer(canvas, imageSrc, settings = {}) {
  const gl = canvas.getContext('webgl', {
    alpha: true, antialias: true, premultipliedAlpha: false,
    powerPreference: 'low-power', preserveDrawingBuffer: true,
  });
  if (!gl) return createCanvasPortraitRenderer(canvas, imageSrc, settings);
  canvas.dataset.renderer = 'webgl';
  const vertex = `
    attribute vec2 a_uv;
    varying vec2 v_uv;
    uniform vec2 u_pose;
    uniform float u_time;
    uniform float u_idle;
    uniform float u_travel;
    uniform float u_tilt;
    uniform float u_nod;
    float falloff(float r, float a, float b) {
      return 1.0 - smoothstep(a, b, r);
    }
    void main() {
      vec2 p = a_uv;
      // Photo-space coordinates calibrated to the wide 1672 x 941 desk scene.
      vec2 headCenter = vec2(0.646, 0.230);
      vec2 pivot = vec2(0.657, 0.425);
      float head = falloff(length((p-headCenter) / vec2(0.102,0.198)), 0.68, 1.37);
      head *= 1.0-smoothstep(0.40,0.53,p.y);
      float face = falloff(length((p-vec2(0.646,0.270)) / vec2(0.071,0.133)),0.1,1.0);
      float sx = u_pose.x;
      float sy = u_pose.y;
      float tilt = sx*u_tilt;
      vec2 q = p-pivot;
      vec2 rotated = vec2(q.x*cos(tilt)-q.y*sin(tilt), q.x*sin(tilt)+q.y*cos(tilt));
      vec2 delta = rotated-q;
      delta += vec2(sx*u_travel, sy*u_nod);
      // Tiny local perspective shift creates a restrained suggestion of yaw.
      delta.x += face*sx*0.004;
      delta.y += face*sy*0.0018;
      p += delta*head;
      // A slow, two-pixel breathing motion; grounded foreground stays still.
      float torso = falloff(length((a_uv-vec2(0.670,0.46))/vec2(0.195,0.25)),0.2,1.0);
      torso *= (1.0-smoothstep(0.56,0.60,a_uv.y));
      p.y += sin(u_time*1.05)*0.0015*torso*u_idle;
      gl_Position = vec4(p.x*2.0-1.0,1.0-p.y*2.0,0.0,1.0);
      v_uv = a_uv;
    }`;
  const fragment = `precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_image;
    void main(){ gl_FragColor=texture2D(u_image,v_uv); }`;
  const shaders = [];
  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader); throw new Error('Portrait shader could not compile.');
    }
    shaders.push(shader); return shader;
  }
  let program, buffer, texture, ready = false, destroyed = false;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Portrait shader could not link.');
  } catch (error) {
    shaders.forEach(s => gl.deleteShader(s));
    if (program) gl.deleteProgram(program);
    settings.onFallback?.();
    return { draw() {}, destroy() {} };
  }
  gl.useProgram(program);
  const points = [], steps = 64;
  for (let row = 0; row < steps; row++) for (let col = 0; col < steps; col++) {
    const x = col/steps, y = row/steps, n = 1/steps;
    points.push(x,y, x+n,y, x,y+n, x,y+n, x+n,y, x+n,y+n);
  }
  buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
  const attr = gl.getAttribLocation(program, 'a_uv');
  gl.enableVertexAttribArray(attr); gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
  const uniform = name => gl.getUniformLocation(program, name);
  const pose = uniform('u_pose'), time = uniform('u_time'), idle = uniform('u_idle');
  gl.uniform1f(uniform('u_travel'), settings.headTravel ?? 0.006);
  gl.uniform1f(uniform('u_tilt'), settings.headTilt ?? 0.018);
  gl.uniform1f(uniform('u_nod'), settings.nodTravel ?? 0.008);
  texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.uniform1i(uniform('u_image'),0);
  let last = [0,0,0,0];
  function resize() {
    if (destroyed) return;
    const r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1,2);
    const w = Math.max(1, Math.round(r.width*dpr));
    const h = Math.max(1, Math.round(r.height*dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width=w; canvas.height=h; }
    gl.viewport(0,0,w,h); draw(...last);
  }
  function draw(x=0,y=0,seconds=0,idleAmount=0) {
    last=[x,y,seconds,idleAmount];
    if (!ready || destroyed || gl.isContextLost()) return;
    gl.useProgram(program); gl.uniform2f(pose,x,y);
    gl.uniform1f(time,seconds); gl.uniform1f(idle,idleAmount);
    gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES,0,points.length/2);
    // Useful for browser integration tests; never announce per-frame movement.
    canvas.dataset.poseX=x.toFixed(3); canvas.dataset.poseY=y.toFixed(3);
  }
  const image = new Image();
  image.onload = () => {
    if (destroyed || gl.isContextLost()) return;
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    ready=true; resize(); canvas.dataset.ready='true'; settings.onReady?.();
  };
  image.onerror = () => settings.onFallback?.();
  image.src=imageSrc;
  const observer = new ResizeObserver(resize); observer.observe(canvas);
  const lost = e => { e.preventDefault(); ready=false; canvas.dataset.ready='false'; settings.onFallback?.(); };
  const restored = () => settings.onRestore?.();
  canvas.addEventListener('webglcontextlost',lost);
  canvas.addEventListener('webglcontextrestored',restored);
  return {
    draw,
    destroy() {
      destroyed=true; image.onload=null; image.onerror=null; observer.disconnect();
      canvas.removeEventListener('webglcontextlost',lost);
      canvas.removeEventListener('webglcontextrestored',restored);
      gl.deleteTexture(texture); gl.deleteBuffer(buffer); gl.deleteProgram(program);
      shaders.forEach(s => gl.deleteShader(s));
    },
  };
}
