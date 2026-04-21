const axios = require('axios');

/**
 * SSWEB Scraper by Topi Dev
 * Logic: Request to Provider -> Get URL -> Download to Buffer
 */
const ssweb = async (url, { width = 1280, height = 720, full_page = false } = {}) => {
    try {
        // 1. Request screenshot ke provider (Imagy GCP)
        const { data } = await axios.post('https://gcp.imagy.app/screenshot/createscreenshot', {
            url: url,
            browserWidth: width,
            browserHeight: height,
            fullPage: full_page,
            deviceScaleFactor: 1,
            format: 'png'
        }, {
            headers: {
                'content-type': 'application/json',
                'referer': 'https://imagy.app/full-page-screenshot-taker/',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
            }
        });
        
        if (!data || !data.fileUrl) throw new Error("Gagal mendapatkan link gambar dari provider.");

        // 2. Download hasil screenshot menjadi Buffer
        const imageResponse = await axios.get(data.fileUrl, { responseType: 'arraybuffer' });
        return Buffer.from(imageResponse.data);

    } catch (error) {
        throw new Error(error.message);
    }
};

module.exports = function (app) {
    app.get("/tools/ssweb", async (req, res) => {
        const { url, size, full } = req.query;

        // Validasi input
        if (!url) {
            return res.status(400).json({ 
                status: false, 
                message: "URL is required (e.g. https://google.com)" 
            });
        }

        // Mapping resolusi perangkat
        const devices = {
            desktop: { w: 1280, h: 720 },
            tablet: { w: 768, h: 1024 },
            mobile: { w: 375, h: 667 }
        };

        const device = devices[size] || devices.desktop;

        try {
            const buffer = await ssweb(url, {
                width: device.w,
                height: device.h,
                full_page: full === 'true'
            });

            // Kirim response dalam bentuk gambar PNG langsung
            res.set('Content-Type', 'image/png');
            res.send(buffer);

        } catch (err) {
            res.status(500).json({ 
                status: false, 
                error: err.message 
            });
        }
    });
};
