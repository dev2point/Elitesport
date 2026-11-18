import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const combined = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // filter none
    rgba.copy(raw, rowStart + 1, y * stride, (y + 1) * stride);
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

const COLORS = {
  green: [31, 93, 58], // #1f5d3a
  orange: [232, 89, 12], // #e8590c
  ball: [248, 247, 242], // #f8f7f2
  ink: [22, 35, 27], // #16231b
};

function pointInPolygon(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function distToPolygonEdges(px, py, pts) {
  let minD = Infinity;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    minD = Math.min(minD, distToSegment(px, py, x1, y1, x2, y2));
  }
  return minD;
}

function regularPentagon(cx, cy, r, rotationRad = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const angle = rotationRad + (i * 2 * Math.PI) / 5;
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return pts;
}

function samplePixel(nx, ny, { maskable }) {
  // Normalized coordinates [-1, 1] from center
  const scale = maskable ? 0.66 : 0.78;
  const bx = nx / scale;
  const by = ny / scale;
  const distFromCenter = Math.hypot(bx, by);

  // Subtle rounded border accent for non-maskable icons
  if (!maskable) {
    const maxCoord = Math.max(Math.abs(nx), Math.abs(ny));
    if (maxCoord > 0.87 && maxCoord < 0.91) {
      return COLORS.orange;
    }
  }

  // Ball outer radius = 0.82 in scaled space
  const ballR = 0.82;
  const strokeHalf = 0.032;

  if (distFromCenter > ballR + strokeHalf) {
    return COLORS.green;
  }
  if (distFromCenter >= ballR - strokeHalf) {
    return COLORS.ink;
  }

  // Inside soccer ball
  const centerPent = regularPentagon(0, 0, 0.28);
  if (pointInPolygon(bx, by, centerPent)) {
    return distToPolygonEdges(bx, by, centerPent) < 0.025 ? COLORS.ink : COLORS.orange;
  }
  if (distToPolygonEdges(bx, by, centerPent) < 0.025) {
    return COLORS.ink;
  }

  // Radiating seams from center pentagon vertices to outer patches
  const outerPatches = [];
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const vx = 0.28 * Math.cos(angle);
    const vy = 0.28 * Math.sin(angle);
    const ox = 0.66 * Math.cos(angle);
    const oy = 0.66 * Math.sin(angle);

    if (distToSegment(bx, by, vx, vy, ox, oy) < 0.024) {
      return COLORS.ink;
    }

    const patchCenterR = 0.78;
    const patch = regularPentagon(
      patchCenterR * Math.cos(angle),
      patchCenterR * Math.sin(angle),
      0.2,
      angle + Math.PI
    );
    outerPatches.push(patch);
  }

  for (const patch of outerPatches) {
    if (pointInPolygon(bx, by, patch)) {
      return COLORS.green;
    }
  }

  return COLORS.ball;
}

function renderIcon(size, options) {
  const buf = Buffer.alloc(size * size * 4);
  const sub = 3; // 3x3 supersampling for clean anti-aliasing

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;

      for (let sy = 0; sy < sub; sy++) {
        for (let sx = 0; sx < sub; sx++) {
          const px = x + (sx + 0.5) / sub;
          const py = y + (sy + 0.5) / sub;
          const nx = (px / size) * 2 - 1;
          const ny = (py / size) * 2 - 1;
          const [cr, cg, cb] = samplePixel(nx, ny, options);
          r += cr;
          g += cg;
          b += cb;
        }
      }

      const samples = sub * sub;
      const idx = (y * size + x) * 4;
      buf[idx] = Math.round(r / samples);
      buf[idx + 1] = Math.round(g / samples);
      buf[idx + 2] = Math.round(b / samples);
      buf[idx + 3] = 255;
    }
  }

  return encodePng(size, size, buf);
}

const outDir = path.join(process.cwd(), 'public');
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  { file: 'pwa-192x192.png', size: 192, maskable: false },
  { file: 'pwa-512x512.png', size: 512, maskable: false },
  { file: 'pwa-maskable-512x512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: true },
];

for (const t of targets) {
  const png = renderIcon(t.size, { maskable: t.maskable });
  fs.writeFileSync(path.join(outDir, t.file), png);
  console.log(`Generated ${t.file} (${t.size}x${t.size}, ${png.length} bytes)`);
}
