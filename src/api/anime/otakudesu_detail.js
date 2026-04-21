const axios = require('axios');

/**
 * Otakudesu Detail Scraper
 * Engine: Siputzx
 */
async function getAnimeDetail(url) {
    try {
        const response = await axios.get(`https://api.siputzx.my.id/api/anime/otakudesu/detail`, {
            params: { url: url },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
            }
        });

        if (!response.data.status || !response.data.data) {
            return null;
        }

        const raw = response.data.data;
        
        return {
            info: {
                title: raw.animeInfo.title,
                japanese: raw.animeInfo.japaneseTitle,
                score: raw.animeInfo.score,
                studio: raw.animeInfo.studio,
                release: raw.animeInfo.releaseDate,
                genres: raw.animeInfo.genres,
                status: raw.animeInfo.status,
                thumbnail: raw.animeInfo.imageUrl
            },
            episodes: raw.episodes.map(v => ({
                title: v.title,
                date: v.date,
                url: v.link
            }))
        };
    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports = function (app) {
    /**
     * Path: /anime/detail/otakudesu
     * Query: url (Link dari search atau ongoing)
     */
    app.get("/anime/detail/otakudesu", async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ 
                status: false, 
                message: "Masukan URL anime Otakudesu-nya!" 
            });
        }

        try {
            const result = await getAnimeDetail(url);
            
            if (!result) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Detail anime tidak ditemukan." 
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
