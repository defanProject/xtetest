const { createCanvas, loadImage } = require('canvas');

async function makeBlur(imageUrl, level = 5) {
    try {
        const img = await loadImage(imageUrl);
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');

        // Logic: Gambar dikecilin dulu baru digedein (Fast Blur)
        const blurLevel = parseInt(level) || 5;
        const scale = 1 / blurLevel; 
        
        const sw = img.width * scale;
        const sh = img.height * scale;

        // Gambar versi kecil
        ctx.drawImage(img, 0, 0, sw, sh);

        // Tarik lagi ke ukuran asli (Smoothing bikin dia Blur)
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(canvas, 0, 0, sw, sh, 0, 0, canvas.width, canvas.height);

        return canvas.toBuffer('image/jpeg');
    } catch (err) {
        throw new Error("Gagal load gambar: " + err.message);
    }
}

module.exports = function (app) {
    app.get("/canvas/blur", async (req, res) => {
        const { image, level } = req.query;
        if (!image) return res.status(400).json({ status: false, message: "Mana gambarnya?" });

        try {
            const buffer = await makeBlur(image, level);
            res.set('Content-Type', 'image/jpeg');
            res.send(buffer);
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
