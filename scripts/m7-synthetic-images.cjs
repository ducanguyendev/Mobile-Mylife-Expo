const fs = require('node:fs'), zlib = require('node:zlib');
function crc(bytes) { let value = 0xffffffff; for (const b of bytes) { value ^= b; for (let j = 0; j < 8; j++) value = value & 1 ? (value >>> 1) ^ 0xedb88320 : value >>> 1; } return (value ^ 0xffffffff) >>> 0; }
function chunk(type, bytes) { const t = Buffer.from(type), size = Buffer.alloc(4), sum = Buffer.alloc(4); size.writeUInt32BE(bytes.length); sum.writeUInt32BE(crc(Buffer.concat([t, bytes]))); return Buffer.concat([size, t, bytes, sum]); }
for (const [name, color] of [['sage', [96, 121, 94]], ['ivory', [230, 190, 90]]]) {
  const header = Buffer.alloc(13); header.writeUInt32BE(240, 0); header.writeUInt32BE(180, 4); header[8] = 8; header[9] = 2;
  const pixels = Buffer.alloc(180 * (1 + 240 * 3)); for (let y = 0; y < 180; y++) for (let x = 0; x < 240; x++) for (let c = 0; c < 3; c++) pixels[y * 721 + 1 + x * 3 + c] = (x + y) % 40 < 20 ? color[c] : Math.min(color[c] + 35, 255);
  fs.writeFileSync(`.tmp/m7-${name}.png`, Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]));
}
console.log('Created two synthetic striped PNG fixtures; no family/user photos.');
