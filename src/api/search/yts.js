const axios = require('axios');

/**
 * YouTube Search Engine
 * Source: Siputzx API
 */
async function youtubeSearch(query) {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/s/youtube`, {
            params: { query: query }
        });

        if (!data.status || !data.data) return null;

        // Kita mapping biar datanya lebih rapi dan konsisten dengan endpoint lain
        return data.data.map(v => ({
            title: v.title,
            id: v.videoId,
            url: v.url,
            duration: v.timestamp,
            views: v.views,
            upload_date: v.ago,
            author: {
                name: v.author.name,
                url: v.author.url
            },
            thumbnail: v.image,
            description: v.description
        }));
    } catch (err) {
        return null;
    }
}

module.exports = function (app) {
    // Path langsung: /search/youtube
    app.get("/search/youtube", async (req, res) => {
        const { q } = req.query;
        if (!q) return res.status(400).json({ 
            status: false, 
            message: "Masukan kata kunci pencarian, Brahhh!" 
        });

        try {
            const result = await youtubeSearch(q);
            
            if (!result || result.length === 0) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Video tidak ditemukan." 
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
