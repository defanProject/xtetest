const { createCanvas, loadImage, registerFont } = require('canvas');

/**
 * Goodbye Card V5 Engine
 * Support custom background & quality
 */
async function createGoodbyeCard(username, guildName, memberCount, avatarUrl, bgUrl, quality = 90) {
    // Ukuran standar kartu (HD)
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');

    // 1. Load Background
    try {
        const background = await loadImage(bgUrl || 'https://i.ibb.co/4YBNyvP/mountain-sunset.jpg');
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        
        // Kasih overlay gelap dikit biar teks putihnya "pop out"
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } catch (e) {
        ctx.fillStyle = '#2c3e50'; // Fallback warna gelap
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

        // Stroke Lingkaran Avatar
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(400, 130, 85, 0, Math.PI * 2, true);
        ctx.stroke();
    } catch (e) {
        console.log("Avatar failed to load");
    }

    // 3. Render Teks
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';

    // Tulisan "Goodbye"
    ctx.font = 'bold 45px Arial';
    ctx.fillText('GOODBYE', 400, 260);

    // Username
    ctx.font = '35px Arial';
    ctx.fillText(username || 'User Name', 400, 305);

    // Guild Name & Member Count
    ctx.font = '20px Arial';
    ctx.fillText(`${guildName || 'Community'} Member #${memberCount || '0'}`, 400, 350);

    // Output Buffer dengan Quality (JPEG)
    return canvas.toBuffer('image/jpeg', { quality: quality / 100 });
}

module.exports = function (app) {
    /**
     * Path: /canvas/goodbyev5
     */
    app.get("/canvas/goodbyev5", async (req, res) => {
        const { username, guildName, memberCount, avatar, background, quality } = req.query;

        try {
            const q = parseInt(quality) || 90;
            const buffer = await createGoodbyeCard(username, guildName, memberCount, avatar, background, q);
            
            res.set('Content-Type', 'image/jpeg');
            res.send(buffer);
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
