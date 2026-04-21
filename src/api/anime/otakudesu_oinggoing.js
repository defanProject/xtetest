const axios = require('axios');

/**
 * Otakudesu Ongoing Anime Engine
 * Engine: Siputzx
 */
async function getOngoingAnime() {
    try {
        const response = await axios.get(`https://api.siputzx.my.id/api/anime/otakudesu/ongoing`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
            }
        });

        if (!response.data.status || !response.data.data) {
            return null;
        }

        return response.data.data.map(v => ({
            title: v.title,
            episode: v.episode,
            day: v.type, // 'type' di respon asli itu nama hari rilis
            date: v.date,
            url: v.link,
            thumbnail: v.image
        }));
    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports = function (app) {
    /**
     * Path: /anime/ongoing/otakudesu
     */
    app.get("/anime/ongoing/otakudesu", async (req, res) => {
        try {
            const results = await getOngoingAnime();
            
            if (!results || results.length === 0) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Gagal mengambil daftar anime ongoing." 
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
