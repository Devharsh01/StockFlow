import fs from 'fs';
import path from 'path';

const iconsDir = path.join(process.cwd(), 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate sleek StockFlow SVG icon
const getSvgContent = (size = 512) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="112" fill="#0F172A"/>
  <rect x="16" y="16" width="480" height="480" rx="96" stroke="url(#paint0_linear)" stroke-width="4" stroke-opacity="0.3"/>
  <g filter="url(#glow)">
    <!-- Isometric Cube Base -->
    <path d="M256 96L392 168V328L256 400L120 328V168L256 96Z" stroke="url(#paint1_linear)" stroke-width="14" stroke-linejoin="round" fill="#1E293B" fill-opacity="0.6"/>
    <path d="M256 96V248M256 248L392 328M256 248L120 328" stroke="url(#paint1_linear)" stroke-width="12" stroke-linejoin="round"/>
    
    <!-- Stylized S Stream -->
    <path d="M330 180C330 180 280 144 240 180C200 216 312 248 272 296C232 344 170 312 170 312" stroke="url(#paint2_linear)" stroke-width="28" stroke-linecap="round"/>
  </g>
  
  <defs>
    <linearGradient id="paint0_linear" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="#38BDF8"/>
      <stop offset="1" stop-color="#34D399"/>
    </linearGradient>
    <linearGradient id="paint1_linear" x1="120" y1="96" x2="392" y2="400" gradientUnits="userSpaceOnUse">
      <stop stop-color="#00F2FE"/>
      <stop offset="1" stop-color="#4FACFE"/>
    </linearGradient>
    <linearGradient id="paint2_linear" x1="170" y1="180" x2="330" y2="312" gradientUnits="userSpaceOnUse">
      <stop stop-color="#38BDF8"/>
      <stop offset="0.5" stop-color="#818CF8"/>
      <stop offset="1" stop-color="#34D399"/>
    </linearGradient>
    <filter id="glow" x="90" y="70" x2="332" y3="350" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#38BDF8" flood-opacity="0.35"/>
    </filter>
  </defs>
</svg>`;

const svgPath = path.join(iconsDir, 'icon.svg');
fs.writeFileSync(svgPath, getSvgContent(512));
console.log('Generated public/icons/icon.svg');

try {
  const sharp = (await import('sharp')).default;
  const svgBuffer = Buffer.from(getSvgContent(512));

  await sharp(svgBuffer).resize(192, 192).toFile(path.join(iconsDir, 'icon-192x192.png'));
  await sharp(svgBuffer).resize(512, 512).toFile(path.join(iconsDir, 'icon-512x512.png'));
  await sharp(svgBuffer).resize(180, 180).toFile(path.join(iconsDir, 'apple-touch-icon.png'));

  console.log('Successfully generated PNG icons (192x192, 512x512, apple-touch-icon.png)');
} catch (e) {
  console.log('Sharp not loaded yet, created SVG icon:', e.message);
}
