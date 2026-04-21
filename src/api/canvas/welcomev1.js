const { createCanvas, loadImage } = require('canvas');

/**
 * Welcome Card V1 Engine
 * Fitur: Custom BG, Avatar, Guild Icon, & Quality
 */
async function createWelcomeV1(username, guildName, guildIcon, memberCount, avatarUrl, bgUrl, quality = 80) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');

    // 1. Render Background
    try {
        const background = await loadImage(bgUrl || 'https://i.ibb.co/4YBNyvP/images-76.jpg');
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        
        // Overlay putih transparan biar estetik & teks kebaca
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } catch (e) {
        ctx.fillStyle = '#3498db';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Lingkaran Avatar (Center)
    try {
        const avatar = await loadImage(avatarUrl || 'https://telegra.ph/file/0ee0811e998782073998b.jpg');
        ctx.save();
        ctx.beginPath();
        ctx.arc(400, 130, 85, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 315, 45, 170, 170);
        ctx.restore();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(400, 130, 85, 0, Math.PI * 2, true);
        ctx.stroke();
    } catch (e) {}

    // 3. Guild Icon (Pojok Kiri Atas)
    try {
        if (guildIcon) {
            const gIcon = await loadImage(guildIcon);
            ctx.save();
            ctx.beginPath();
            ctx.arc(60, 60, 40, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(gIcon, 20, 20, 80, 80);
            ctx.restore();
        }
    } catch (e) {}

    // 4. Render Text
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;

    // "Welcome"
    ctx.font = 'bold 50px Arial';
    ctx.fillText('WELCOME', 400, 260);

    // Name
    ctx.font = '35px Arial';
    ctx.fillText(username || 'New Member', 400, 310);

    // Community Info
    ctx.font = '22px Arial';
    ctx.shadowBlur = 0;
    ctx.fillText(`Welcome to ${guildName || 'Our Club'}`, 400, 355);
    ctx.fillText(`You are our ${memberCount || '0'}th member!`, 400, 385);

    return canvas.toBuffer('image/jpeg', { quality: quality / 100 });
}

module.exports = function (app) {
    app.get("/canvas/welcomev1", async (req, res) => {
        const { username, guildName, guildIcon, memberCount, avatar, background, quality } = req.query;

        try {
            const q = parseInt(quality) || 80;
            const buffer = await createWelcomeV1(username, guildName, guildIcon, memberCount, avatar, background, q);
            
            res.set('Content-Type', 'image/jpeg');
            res.send(buffer);
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
