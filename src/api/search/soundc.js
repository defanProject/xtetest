const axios = require('axios');
const cheerio = require('cheerio');

async function scSearch(q) {
    try {
        const url = 'https://m.soundcloud.com/search?q=' + encodeURIComponent(q);
        const { data: html } = await axios.get(url, {
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(html);
        const nextDataText = $('#__NEXT_DATA__').text();
        if (!nextDataText) throw new Error("Data tidak ditemukan");

        const json = JSON.parse(nextDataText);
        const tracks = json.props.pageProps.initialStoreState.entities.tracks;

        if (!tracks) return [];

        return Object.values(tracks)
            .filter(v => v && v.data && v.data.title)
            .map(v => {
                const d = v.data;
                return {
                    id: d.id || '-',
                    title: d.title || '-',
                    url: d.permalink_url || '-',
                    user_id: d.user_id || '-',
                    artwork: d.artwork_url || null,
                    duration: d.duration || '-',
                    plays: d.playback_count || '-',
                    likes: d.likes_count || '-',
                    comments: d.comment_count || '-',
                    reposts: d.reposts_count || '-',
                    created_at: d.created_at || '-'
                };
            });
    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports = function (app) {
    app.get("/search/soundcloud", async (req, res) => {
        const { q } = req.query;
        if (!q) return res.status(400).json({ status: false, message: "Query parameter 'q' is required" });

        try {
            const results = await scSearch(q);
            res.status(200).json({
                status: true,
                result: results
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
