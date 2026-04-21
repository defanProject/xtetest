const axios = require('axios');

/**
 * Pinterest Scraper (V2 - Siputzx Engine)
 * Support: image, gif, video
 */
async function siputzxPinterest(query, type = 'image') {
    try {
        const response = await axios.get(`https://api.siputzx.my.id/api/s/pinterest`, {
            params: {
                query: query,
                type: type
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
            }
        });

        if (!response.data.status || !response.data.data) {
            throw new Error("Data nggak ditemuin di server pusat, Brahhh!");
        }

        // Mapping biar clean sesuai standar GooTa API
        return response.data.data.map(v => ({
            id: v.id,
            title: v.grid_title || v.seo_alt_text,
            description: v.description,
            type: v.type,
            media: {
                image: v.image_url,
                video: v.video_url,
                gif: v.gif_url
            },
            pin_url: v.pin,
            author: {
                name: v.pinner?.full_name,
                username: v.pinner?.username,
                avatar: v.pinner?.image_small_url
            },
            stats: {
                reactions: v.reaction_counts?.['1'] || 0,
                created_at: v.created_at
            }
        }));
    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports = function (app) {
    // Path: /search/pinterest_v2
    app.get("/search/pinterest", async (req, res) => {
        const { q, type } = req.query; // type: image, gif, video

        if (!q) return res.status(400).json({ status: false, message: "Query (q) nya jangan kosong, Brahhh!" });

        try {
            const results = await siputzxPinterest(q, type || 'image');
            
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
