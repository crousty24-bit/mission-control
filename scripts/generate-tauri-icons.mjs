import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const rootDir = process.cwd();
const outputDir = join(rootDir, "src-tauri", "icons");
const sizes = [32, 128, 256, 512];

mkdirSync(outputDir, { recursive: true });

function crc32(buffer) {
	let crc = 0xffffffff;

	for (let i = 0; i < buffer.length; i += 1) {
		crc ^= buffer[i];
		for (let bit = 0; bit < 8; bit += 1) {
			const mask = -(crc & 1);
			crc = (crc >>> 1) ^ (0xedb88320 & mask);
		}
	}

	return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
	const typeBuffer = Buffer.from(type, "ascii");
	const length = Buffer.alloc(4);
	length.writeUInt32BE(data.length, 0);

	const crcBuffer = Buffer.alloc(4);
	crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

	return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function createPng(size) {
	const scanlineLength = size * 4 + 1;
	const raw = Buffer.alloc(scanlineLength * size);

	for (let y = 0; y < size; y += 1) {
		const rowOffset = y * scanlineLength;
		raw[rowOffset] = 0;

		for (let x = 0; x < size; x += 1) {
			const offset = rowOffset + 1 + x * 4;
			const normalizedX = x / Math.max(size - 1, 1);
			const normalizedY = y / Math.max(size - 1, 1);

			const baseR = 28;
			const baseG = 17;
			const baseB = 13;

			const warmR = 240;
			const warmG = 156;
			const warmB = 92;

			const blend = Math.min(
				1,
				Math.max(0, normalizedX * 0.58 + (1 - normalizedY) * 0.42),
			);
			raw[offset] = Math.round(baseR + (warmR - baseR) * blend);
			raw[offset + 1] = Math.round(baseG + (warmG - baseG) * blend);
			raw[offset + 2] = Math.round(baseB + (warmB - baseB) * blend);
			raw[offset + 3] = 255;
		}
	}

	const center = size / 2;
	const outerRadius = size * 0.34;
	const innerRadius = size * 0.22;

	for (let y = 0; y < size; y += 1) {
		for (let x = 0; x < size; x += 1) {
			const dx = x - center;
			const dy = y - center;
			const distance = Math.sqrt(dx * dx + dy * dy);
			const offset = y * scanlineLength + 1 + x * 4;

			if (distance < outerRadius && distance > innerRadius) {
				raw[offset] = 244;
				raw[offset + 1] = 217;
				raw[offset + 2] = 187;
			}

			if (
				Math.abs(dx) < size * 0.035 &&
				dy > -outerRadius &&
				dy < outerRadius
			) {
				raw[offset] = 244;
				raw[offset + 1] = 217;
				raw[offset + 2] = 187;
			}

			if (
				dy < 0 &&
				Math.abs(dy + dx * 0.62) < size * 0.03 &&
				distance < outerRadius
			) {
				raw[offset] = 244;
				raw[offset + 1] = 217;
				raw[offset + 2] = 187;
			}
		}
	}

	const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(size, 0);
	ihdr.writeUInt32BE(size, 4);
	ihdr[8] = 8;
	ihdr[9] = 6;
	ihdr[10] = 0;
	ihdr[11] = 0;
	ihdr[12] = 0;

	const idat = deflateSync(raw);

	return Buffer.concat([
		signature,
		chunk("IHDR", ihdr),
		chunk("IDAT", idat),
		chunk("IEND", Buffer.alloc(0)),
	]);
}

for (const size of sizes) {
	writeFileSync(join(outputDir, `${size}x${size}.png`), createPng(size));
}

const desktopSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#1c110d"/>
      <stop offset="100%" stop-color="#f09c5c"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="118" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="166" fill="none" stroke="#f4d9bb" stroke-width="36"/>
  <rect x="240" y="128" width="32" height="256" rx="16" fill="#f4d9bb"/>
  <path d="M192 164 L256 248 L320 164" fill="none" stroke="#f4d9bb" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

writeFileSync(join(outputDir, "icon.svg"), desktopSvg, "utf8");

console.log(`Generated Tauri icons in ${outputDir}`);
