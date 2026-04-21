const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

/**
 * Premium Quote Maker — by Topi Dev
 * Features:
 *  - Auto-resize canvas (portrait/landscape/square friendly)
 *  - Cinematic dark vignette overlay
 *  - Glassmorphism quote card
 *  - Left accent bar
 *  - Open-quote " decorative glyph
 *  - Smart word-wrap with line-height control
 *  - Twitter-style verified blue checkmark badge
 *  - Author name + username support
 *  - Subtle grain texture overlay
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Wrap text into lines respecting maxWidth */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Draw a rounded rectangle path */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Draw Twitter/X-style verified blue checkmark */
function drawVerifiedBadge(ctx, cx, cy, size) {
  const r = size / 2;

  // Blue circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#1D9BF0';
  ctx.fill();

  // White checkmark
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.14;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.38, cy + r * 0.02);
  ctx.lineTo(cx - r * 0.05, cy + r * 0.38);
  ctx.lineTo(cx + r * 0.42, cy - r * 0.32);
  ctx.stroke();
  ctx.restore();
}

/** Add subtle film-grain noise overlay */
function addGrain(ctx, width, height, opacity = 0.04) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 255 * opacity * 4;
    data[i]     = Math.min(255, Math.max(0, data[i]     + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);
}

// ─── Main ────────────────────────────────────────────────────────────────────

/**
 * @param {string} imageUrl   - Background image URL
 * @param {string} quoteText  - The quote / kata-kata
 * @param {string} [author]   - Nama penulis (opsional)
 * @param {string} [username] - Username / handle (opsional, e.g. @topi_dev)
 * @param {string} [accent]   - Warna aksen kartu (default biru cerah)
 */
const createQuote = async (
  imageUrl,
  quoteText,
  author   = '',
  username = '',
  accent   = '#38BDF8'
) => {
  // 1. Download background
  const response  = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const imgBuffer = Buffer.from(response.data);
  const image     = await loadImage(imgBuffer);

  const W = image.width;
  const H = image.height;

  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  // ── 2. Background image ──────────────────────────────────────────────────
  ctx.drawImage(image, 0, 0, W, H);

  // ── 3. Vignette (radial dark gradient) ──────────────────────────────────
  const vignette = ctx.createRadialGradient(W/2, H/2, H*0.1, W/2, H/2, H*0.85);
  vignette.addColorStop(0, 'rgba(0,0,0,0.0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  // ── 4. Glassmorphism quote card ──────────────────────────────────────────
  const pad     = W * 0.06;
  const cardX   = pad;
  const cardW   = W - pad * 2;

  // Dynamic font sizes
  const quoteFontSize  = Math.max(22, Math.floor(W / 18));
  const authorFontSize = Math.max(16, Math.floor(W / 26));
  const userFontSize   = Math.max(13, Math.floor(W / 32));
  const bigQuotePx     = Math.floor(W / 5);

  // Measure wrapped text first to know card height
  ctx.font = `600 ${quoteFontSize}px 'Georgia', serif`;
  const maxTextW = cardW - W * 0.14;  // accounting for left bar + inner padding
  const lines    = wrapText(ctx, quoteText, maxTextW);
  const lineH    = quoteFontSize * 1.55;

  const innerPadV    = W * 0.045;
  const bigQuoteH    = bigQuotePx * 0.55;
  const textBlockH   = lines.length * lineH;
  const authorBlockH = (author || username) ? authorFontSize * 1.4 + userFontSize * 1.4 + W * 0.015 : 0;

  const cardH  = innerPadV + bigQuoteH + textBlockH + (author ? W*0.03 : 0) + authorBlockH + innerPadV;
  const cardY  = (H - cardH) / 2;

  // Card background: semi-transparent frosted
  ctx.save();
  roundRect(ctx, cardX, cardY, cardW, cardH, W * 0.025);
  ctx.fillStyle = 'rgba(10, 14, 26, 0.62)';
  ctx.fill();

  // Card border glow
  roundRect(ctx, cardX, cardY, cardW, cardH, W * 0.025);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth   = 1.5;
  ctx.stroke();
  ctx.restore();

  // Left accent bar
  const barX = cardX + W * 0.018;
  const barY = cardY + innerPadV * 0.7;
  const barH = cardH - innerPadV * 1.4;
  const barW = W * 0.007;

  ctx.save();
  const barGrad = ctx.createLinearGradient(0, barY, 0, barY + barH);
  barGrad.addColorStop(0,   accent);
  barGrad.addColorStop(0.5, '#818CF8');
  barGrad.addColorStop(1,   'rgba(56,189,248,0.2)');
  roundRect(ctx, barX, barY, barW, barH, barW / 2);
  ctx.fillStyle = barGrad;
  ctx.fill();
  ctx.restore();

  // ── 5. Big decorative opening quote " ───────────────────────────────────
  const textStartX = barX + barW + W * 0.03;

  ctx.save();
  ctx.font      = `900 ${bigQuotePx}px 'Georgia', serif`;
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.25;
  ctx.fillText('\u201C', textStartX - W * 0.008, cardY + innerPadV + bigQuoteH * 0.85);
  ctx.restore();

  // ── 6. Quote text ────────────────────────────────────────────────────────
  let currentY = cardY + innerPadV + bigQuoteH * 0.6;

  ctx.save();
  ctx.font      = `600 ${quoteFontSize}px 'Georgia', serif`;
  ctx.fillStyle = '#F1F5F9';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Subtle text shadow for legibility
  ctx.shadowColor   = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur    = 8;
  ctx.shadowOffsetY = 2;

  for (const line of lines) {
    ctx.fillText(line, textStartX, currentY);
    currentY += lineH;
  }
  ctx.restore();

  // ── 7. Divider line ──────────────────────────────────────────────────────
  if (author || username) {
    currentY += W * 0.02;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(textStartX, currentY);
    ctx.lineTo(cardX + cardW - W * 0.04, currentY);
    const divGrad = ctx.createLinearGradient(textStartX, 0, cardX + cardW - W * 0.04, 0);
    divGrad.addColorStop(0,   accent);
    divGrad.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth   = 1.2;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.restore();

    currentY += W * 0.018;
  }

  // ── 8. Author block + Verified badge ─────────────────────────────────────
  if (author) {
    const badgeSize = authorFontSize * 1.15;

    ctx.save();
    ctx.font      = `700 ${authorFontSize}px 'Helvetica Neue', Arial, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.shadowColor   = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur    = 6;
    ctx.fillText(author, textStartX, currentY + authorFontSize / 2);
    ctx.restore();

    // Author text width to place badge right after
    ctx.font = `700 ${authorFontSize}px 'Helvetica Neue', Arial, sans-serif`;
    const authorW = ctx.measureText(author).width;
    const badgeCX = textStartX + authorW + badgeSize * 0.65;
    const badgeCY = currentY + authorFontSize / 2;

    drawVerifiedBadge(ctx, badgeCX, badgeCY, badgeSize);

    currentY += authorFontSize * 1.55;
  }

  if (username) {
    ctx.save();
    ctx.font      = `400 ${userFontSize}px 'Helvetica Neue', Arial, sans-serif`;
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.85;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(username.startsWith('@') ? username : `@${username}`, textStartX, currentY);
    ctx.restore();
  }

  // ── 9. Film grain texture ────────────────────────────────────────────────
  addGrain(ctx, W, H, 0.035);

  return canvas.toBuffer('image/png');
};

// ─── Express Route ────────────────────────────────────────────────────────────

module.exports = function (app) {
  app.get('/tools/quotemaker', async (req, res) => {
    const { url, text, author, username, accent } = req.query;

    if (!url || !text) {
      return res.status(400).json({
        status: false,
        message: 'Parameter wajib: url (foto) dan text (kata-kata). Opsional: author, username, accent (#hex).',
      });
    }

    try {
      const buffer = await createQuote(url, text, author || '', username || '', accent || '#38BDF8');
      res.set('Content-Type', 'image/png');
      res.send(buffer);
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  });
};
