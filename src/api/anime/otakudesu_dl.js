const axios = require('axios');

/**
 * Otakudesu Download Scraper
 * Engine: Siputzx
 */
async function getDownloadLinks(url) {
    try {
        const response = await axios.get(`https://api.siputzx.my.id/api/anime/otakudesu/download`, {
            params: { url: url },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
            }
        });

        if (!response.data.status || !response.data.data) {
            return null;
        }

        const raw = response.data.data;
        
        // Bersihkan title (biasanya numpuk banyak teks)
        const cleanTitle = raw.title.split('Subtitle Indonesia')[0] + ' Subtitle Indonesia';

        return {
            title: cleanTitle,
            downloads: raw.downloads.map(v => ({
                quality: v.quality,
                host: v.host,
                url: v.link
            }))
        };
    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports = function (app) {
    /**
     * Path: /anime/download/otakudesu
     * Query: url (Link dari search/ongoing otakudesu)
     */
    app.get("/anime/download/otakudesu", async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ 
                status: false, 
                message: "Mana link Otakudesu-nya, Brahhh?" 
            });
        }

        try {
            const result = await getDownloadLinks(url);
            
            if (!result) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Gagal ngambil link download. Pastiin link valid." 
                });
            }

            res.status(200).json({
                status: true,
                result: result
            });
        } catch (err) {
            res.status(500).json({ 
                status: false, 
                error: err.message 
            });
        }
    });
};
