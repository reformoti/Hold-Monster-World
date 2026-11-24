/* Tileable grayscale detail, sampled by both the WebGL scene and the software portrait. */
(() => {
  'use strict';
  const size = 64;
  const units = 20;
  const tau = Math.PI * 2;
  const tiles = new Map();
  const patterns = new WeakMap();

  const shade = {
    steel(u, v) {
      const bevel = Math.cos(tau * (u + v));
      const brush = Math.cos(tau * (7 * u + v));
      return .84 + .105 * bevel + .045 * brush + .035 * Math.cos(tau * (13 * u - v));
    },
    wood(u, v) {
      const grain = 3 * u + .17 * Math.sin(tau * v) + .09 * Math.sin(tau * (u - v));
      return .80 + .13 * Math.cos(tau * grain) + .055 * Math.cos(2 * tau * grain);
    },
    leather(u, v) {
      const band = (u + 2 * v) % 1;
      const stitch = band > .10 && band < .20 && (5 * u) % 1 < .5;
      if (band < .10) return .55;
      return stitch ? .98 : .82 + .055 * Math.cos(tau * band);
    },
    rune(u, v) {
      const diamond = Math.abs(u - .5) + Math.abs(v - .5);
      if (Math.abs(diamond - .32) < .045) return 1;
      return .76 + .15 * Math.cos(tau * (u - v)) + .06 * Math.cos(tau * diamond);
    },
    plaster(u, v) {
      return .92 + .035 * Math.cos(tau * (5 * u + 3 * v)) + .025 * Math.cos(tau * (19 * u - 13 * v));
    },
    stone(u, v) {
      const row = Math.floor(v * 2), joint = (u * 2 + row * .5) % 1;
      if ((v * 2) % 1 < .065 || joint < .045) return .62;
      return .88 + .06 * Math.cos(tau * (3 * u + v)) + .04 * Math.cos(tau * (17 * u - 11 * v));
    },
    slate(u, v) {
      const row = Math.floor(v * 3), seam = (u * 3 + row * .5) % 1;
      if ((v * 3) % 1 < .07 || seam < .055) return .63;
      return .87 + .07 * Math.cos(tau * (u + 3 * v)) + .04 * Math.cos(tau * (15 * u + 9 * v));
    },
    rock(u, v) {
      return .86 + .07 * Math.cos(tau * (2 * u + 3 * v)) + .04 * Math.cos(tau * (7 * u - 5 * v)) + .025 * Math.cos(tau * (23 * u + 17 * v));
    },
    grass(u, v) {
      return .91 + .035 * Math.cos(tau * (3 * u + 2 * v)) + .04 * Math.cos(tau * (21 * u - 4 * v)) * Math.cos(tau * (5 * u + 17 * v));
    },
    soil(u, v) {
      return .89 + .065 * Math.cos(tau * (4 * u + 3 * v)) + .045 * Math.cos(tau * (13 * u - 11 * v)) + .025 * Math.cos(tau * (27 * u + 19 * v));
    },
    cobble(u, v) {
      const row = Math.floor(v * 2), x = (u * 2 + row * .5) % 1, y = (v * 2) % 1;
      if (x < .07 || y < .09 || x < .13 && y < .16) return .59;
      return .86 + .075 * Math.sin(Math.PI * x) * Math.sin(Math.PI * y) + .035 * Math.cos(tau * (11 * u - 9 * v));
    }
  };

  function pixels(material) {
    if (tiles.has(material)) return tiles.get(material);
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const value = Math.round(255 * shade[material]((x + .5) / size, (y + .5) / size));
        data.set([value, value, value, 255], i);
      }
    }
    tiles.set(material, data);
    return data;
  }

  function texture(gl, material) {
    const tile = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tile);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels(material));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    return tile;
  }

  function pattern(ctx, material) {
    if (!patterns.has(ctx)) patterns.set(ctx, new Map());
    const cache = patterns.get(ctx);
    if (!cache.has(material)) {
      const tile = document.createElement('canvas');
      tile.width = tile.height = size;
      const brush = tile.getContext('2d');
      const image = brush.createImageData(size, size);
      if (image) {
        image.data.set(pixels(material));
        brush.putImageData(image, 0, 0);
      }
      cache.set(material, image ? ctx.createPattern(tile, 'repeat') : null);
    }
    return cache.get(material);
  }

  // Project onto the dominant face plane. The grain follows the longest side of that plane.
  function uv(x, y, z, nx, ny, nz, sx, sy, sz) {
    let u, v;
    if (Math.abs(ny) >= Math.max(Math.abs(nx), Math.abs(nz))) {
      [u, v] = sx > sz ? [z, x] : [x, z];
    } else if (Math.abs(nx) >= Math.abs(nz)) {
      [u, v] = sy > sz ? [z, y] : [y, z];
    } else {
      [u, v] = sx > sy ? [y, x] : [x, y];
    }
    return {x: u * size / units, y: v * size / units};
  }

  function paint(ctx, face) {
    const tile = pattern(ctx, face.material);
    if (!tile) return;
    const [a, b, c] = face.uv;
    const [p, q, r] = face.pts;
    const ux = b.x - a.x, uy = b.y - a.y, vx = c.x - a.x, vy = c.y - a.y;
    const det = ux * vy - vx * uy;
    if (Math.abs(det) < .0001) return;
    const dx = q.x - p.x, dy = q.y - p.y, ex = r.x - p.x, ey = r.y - p.y;
    const m11 = (dx * vy - ex * uy) / det, m12 = (dy * vy - ey * uy) / det;
    const m21 = (ex * ux - dx * vx) / det, m22 = (ey * ux - dy * vx) / det;
    tile.setTransform({a:m11, b:m12, c:m21, d:m22, e:p.x-m11*a.x-m21*a.y, f:p.y-m12*a.x-m22*a.y});
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = tile;
    ctx.fill();
    ctx.restore();
  }

  window.HoMoWMaterials = {units, tileSize:size, pixels, texture, uv, paint};
})();
