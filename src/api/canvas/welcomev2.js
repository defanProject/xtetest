const { createCanvas, loadImage } = require('canvas');

/**
 * Welcome Card V2 Engine
 * Desain lebih clean dengan fokus pada username dan member count
 */
async function createWelcomeV2(username, guildName, memberCount, avatarUrl, bgUrl) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');

    // 1. Render Background
    try {
        const background = await loadImage(bgUrl || 'https://i.ibb.co/4YBNyvP/images-76.jpg');
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        
        // Overlay Gradasi Gelap di bagian bawah biar teks lebih kontras
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } catch (e) {
        ctx.fillStyle = '#1abc9c'; // Warna Toska kalau BG gagal
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Avatar Kotak dengan Rounded Corner (Style Modern)
    try {
        const avatar = await loadImage(avatarUrl || 'https://telegra.ph/file/0ee0811e998782073998b.jpg');
        const x = 320, y = 50, size = 160, radius = 30;
        
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + size - radius, y);
        ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
        ctx.lineTo(x + size, y + size - radius);
        ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
        ctx.lineTo(x + radius, y + size);
        ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, x, y, size, size);
        ctx.restore();

        // Border untuk avatar kotak rounded
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.stroke();
    } catch (e) {}

    // 3. Render Teks
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';

    // Username (Lebih Besar & Bold)
    ctx.font = 'bold 50px Arial';
    ctx.fillText(username || 'Top1dev', 400, 270);

    // Garis Pemisah Tipis
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(250, 290);
    ctx.lineTo(550, 290);
    ctx.stroke();

    // Guild Name
    ctx.font = '30px Arial';
    ctx.fillText(`Welcome to ${guildName || 'topi'}`, 400, 330);

    // Member Count (Badge Style)
    ctx.font = '20px Arial';
    ctx.fillStyle = '#f1c40f'; // Warna kuning biar mencolok
    ctx.fillText(`Member #${memberCount || '150'}`, 400, 370);

    return canvas.toBuffer('image/png');
}

module.exports = function (app) {
    /**
     * Path: /canvas/welcomev2
     */
    app.get("/canvas/welcomev2", async (req, res) => {
        const { username, guildName, memberCount, avatar, background } = req.query;

        try {
            const buffer = await createWelcomeV2(username, guildName, memberCount, avatar, background);
            
            res.set('Content-Type', 'image/png');
            res.send(buffer);
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
