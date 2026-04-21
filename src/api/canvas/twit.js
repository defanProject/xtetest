const { createCanvas, loadImage } = require('canvas');

async function createTweet(displayName, username, comment, avatarUrl, verified, theme = 'dark') {
    const canvas = createCanvas(800, 300);
    const ctx = canvas.getContext('2d');

    const isDark = theme === 'dark';
    const bgColor = isDark ? '#15202b' : '#ffffff';
    const textColor = isDark ? '#ffffff' : '#000000';
    const subColor = isDark ? '#8899a6' : '#5b7083';

    // 1. Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Avatar
    try {
        const avatar = await loadImage(avatarUrl || 'https://telegra.ph/file/0ee0811e998782073998b.jpg');
        ctx.save();
        ctx.beginPath();
        ctx.arc(70, 70, 40, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 30, 30, 80, 80);
        ctx.restore();
    } catch (e) {}

    // 3. Display Name
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = textColor;
    const nameX = 130;
    const nameY = 65;
    ctx.fillText(displayName || 'Name', nameX, nameY);

    // FIX VERIFIED (Drawing Manual)
    if (verified === 'true' || verified === true) {
        const nameWidth = ctx.measureText(displayName || 'Name').width;
        const vX = nameX + nameWidth + 10;
        const vY = nameY - 10;

        ctx.beginPath();
        ctx.arc(vX + 12, vY, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#1da1f2';
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(vX + 6, vY);
        ctx.lineTo(vX + 10, vY + 4);
        ctx.lineTo(vX + 18, vY - 4);
        ctx.stroke();
    }

    // 4. Username
    ctx.font = '22px Arial';
    ctx.fillStyle = subColor;
    ctx.fillText(`@${username || 'username'}`, 130, 95);

    // 5. Comment (Text Wrapping)
    ctx.font = '30px Arial';
    ctx.fillStyle = textColor;
    const words = (comment || 'Hello World!').split(' ');
    let line = '';
    let py = 160;
    for(let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        if (ctx.measureText(testLine).width > 720 && n > 0) {
            ctx.fillText(line, 40, py);
            line = words[n] + ' ';
            py += 40;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, 40, py);

    return canvas.toBuffer();
}

module.exports = function (app) {
    app.get("/canvas/tweet", async (req, res) => {
        const { displayName, username, comment, avatar, verified, theme } = req.query;
        try {
            const buffer = await createTweet(displayName, username, comment, avatar, verified, theme);
            res.set('Content-Type', 'image/png');
            res.send(buffer);
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
