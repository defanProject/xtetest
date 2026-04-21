const { createCanvas, loadImage } = require('canvas');

/**
 * Greyscale Logic
 * Ngubah warna gambar jadi abu-abu lewat manipulasi pixel
 */
async function makeGreyscale(imageUrl) {
    try {
        const img = await loadImage(imageUrl);
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');

        // Gambar asli dulu
        ctx.drawImage(img, 0, 0);

        // Ambil data pixel
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Loop per 4 baris (R, G, B, A)
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i]     = avg; // Red
            data[i + 1] = avg; // Green
            data[i + 2] = avg; // Blue
        }

        // Tumpuk lagi ke canvas
        ctx.putImageData(imageData, 0, 0);
        return canvas.toBuffer('image/jpeg');
    } catch (err) {
        throw new Error("Gagal load gambar. Pastiin URL-nya valid!");
    }
}

module.exports = function (app) {
    /**
     * Path: /canvas/greyscale
     * Query: image (URL Gambar)
     */
    app.get("/canvas/greyscale", async (req, res) => {
        const { image } = req.query;

        if (!image) {
            return res.status(400).json({ 
                status: false, 
                message: "Masukan parameter 'image' berisi URL gambar!" 
            });
        }

        try {
            const buffer = await makeGreyscale(image);
            
            // Kirim respon sebagai image binary
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
