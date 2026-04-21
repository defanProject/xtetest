const axios = require('axios');

/**
 * Otakudesu Anime Search Engine
 * Engine: Siputzx
 */
async function searchOtakudesu(q) {
    try {
        const response = await axios.get(`https://api.siputzx.my.id/api/anime/otakudesu/search`, {
            params: { s: q },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
            }
        });

        if (!response.data.status || !response.data.data) {
            return null;
        }

        return response.data.data.map(v => ({
            title: v.title,
            status: v.status,
            rating: v.rating,
            genres: v.genres,
            url: v.link,
            thumbnail: v.imageUrl
        }));
    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports = function (app) {
    /**
     * Path: /anime/search/otakudesu
     * Query: q (judul anime)
     */
    app.get("/anime/search/otakudesu", async (req, res) => {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ 
                status: false, 
                message: "Judul animenya jangan kosong, Brahhh!" 
            });
        }

        try {
            const results = await searchOtakudesu(q);
            
            if (!results || results.length === 0) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Anime tidak ditemukan." 
                });
            }

            res.status(200).json({
                status: true,
                total: results.length,
                result: results
            });
        } catch (err) {
            res.status(500).json({ 
                status: false, 
                error: err.message 
            });
        }
    });
};
