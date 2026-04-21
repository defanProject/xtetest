const { createCanvas, loadImage } = require('canvas');

/**
 * Darkness Effect Engine
 * Memanipulasi nilai RGB per pixel untuk memberikan efek gelap
 */
async function applyDarkness(imageUrl, amount = 50) {
    try {
        const img = await loadImage(imageUrl);
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');

        // Gambar asli ke canvas
        ctx.drawImage(img, 0, 0);

        // Ambil data image
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Normalisasi amount (0 - 255)
        // Semakin besar amount, semakin gelap
        const darkValue = Math.min(255, Math.max(0, parseInt(amount)));

        for (let i = 0; i < data.length; i += 4) {
            data[i]     = data[i] - darkValue;     // Red
            data[i + 1] = data[i + 1] - darkValue; // Green
            data[i + 2] = data[i + 2] - darkValue; // Blue
            // data[i+3] adalah Alpha (transparansi), gak perlu diubah
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas.toBuffer('image/jpeg');
    } catch (err) {
        throw new Error("Gagal memproses efek gelap. Cek URL gambarnya!");
    }
}

module.exports = function (app) {
    /**
     * Path: /canvas/darkness
     * Query: image (URL), amount (0-255)
     */
    app.get("/canvas/darkness", async (req, res) => {
        const { image, amount } = req.query;

        if (!image) {
            return res.status(400).json({ 
                status: false, 
                message: "Masukan URL gambar di parameter 'image'!" 
            });
        }

        try {
            const buffer = await applyDarkness(image, amount);
            
            res.set('Content-Type', 'image/jpeg');
            res.send(buffer);
        } catch (err) {
            res.status(500).json({ 
                status: false, 
                error: err.message 
            });
        }
    });
};
