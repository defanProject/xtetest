const axios = require('axios');
const cheerio = require('cheerio');

/**
 * INSTAGRAM DOWNLOADER (V2 - InDown)
 * Fitur: Bypass Rate Limit via Random IP
 */
const igDown = {
    generateIP: () => {
        const octet = () => Math.floor(Math.random() * 256);
        return `${octet()}.${octet()}.${octet()}.${octet()}`;
    },

    download: async (url) => {
        try {
            if (!url.includes('instagram.com')) throw new Error("Link Instagram nya mana woy!");

            const randomIP = igDown.generateIP();
            const client = axios.create({
                baseURL: 'https://indown.io',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'x-forwarded-for': randomIP,
                    'x-real-ip': randomIP
                }
            });

            // 1. Ambil Token & Cookie
            const getHome = await client.get('/');
            const $ = cheerio.load(getHome.data);
            const token = $('input[name="_token"]').val();
            const cookies = getHome.headers['set-cookie']?.join('; ');

            if (!token) throw new Error("Gagal nyokot token sési!");

            // 2. Post Data
            const params = new URLSearchParams();
            params.append('referer', 'https://indown.io/');
            params.append('locale', 'en');
            params.append('_token', token);
            params.append('link', url);

            const { data: resultHtml } = await client.post('/download', params, {
                headers: {
                    'Cookie': cookies,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            // 3. Parsing Media
            const $res = cheerio.load(resultHtml);
            const media = [];

            const video = $res('div.container.mt-4 video source').attr('src');
            if (video) {
                media.push(video);
            } else {
                $res('div.container.mt-4 img').each((i, el) => {
                    const img = $res(el).attr('src');
                    if (img && !img.includes('logo')) media.push(img);
                });
            }

            if (media.length === 0) throw new Error("Media teu kapanggih lur.");

            return {
                status: true,
                result: media
            };

        } catch (err) {
            return {
                status: false,
                msg: err.message
            };
        }
    }
};

module.exports = function (app) {
    // Path: /download/ig_v2
    app.get("/download/ig", async (req, res) => {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, message: "Link-nya mana, Brahhh?" });

        try {
            const data = await igDown.download(url);
            if (!data.status) return res.status(404).json(data);
            
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
