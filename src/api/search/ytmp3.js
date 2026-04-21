const axios = require('axios');

/**
 * YouTube Search Engine (Fast Engine)
 */
async function searchYT(q) {
    try {
        const response = await axios.get(`https://test.flvto.online/search/?q=${encodeURIComponent(q)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
                'origin': 'https://v5.ytmp4.is',
                'referer': 'https://v5.ytmp4.is/'
            }
        });

        if (!response.data.items || !response.data.items.length) {
            return null;
        }

        return response.data.items;
    } catch (err) {
        return null;
    }
}

module.exports = function (app) {
    /**
     * Path: /search/youtube
     * Query: q (judul lagu/kata kunci)
     */
    app.get("/search/youtube/mp3", async (req, res) => {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ 
                status: false, 
                message: "Mau cari video apa, Brahhh? Masukin keywordnya!" 
            });
        }

        try {
            const results = await searchYT(q);
            
            if (!results) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Video tidak ditemukan." 
                });
            }

            // Mapping data biar rapi buat konsumsi bot/web
            const finalResult = results.map(v => ({
                id: v.id,
                title: v.title,
                duration: v.duration,
                thumbnail: v.thumbnail,
                url: `https://www.youtube.com/watch?v=${v.id}`
            }));

            res.status(200).json({
                status: true,
                result: finalResult
            });
        } catch (err) {
            res.status(500).json({ 
                status: false, 
                error: err.message 
            });
        }
    });
};
