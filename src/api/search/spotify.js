const https = require("https");

const HARDCODED_TOKEN = "59f9f9a9d566fc84df0715bba166924370d7d9537c0731ec41174550d9a156c4";

function spotdownRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: "spotdown.org",
            path: path,
            method: "GET",
            headers: {
                "Accept": "application/json, text/plain, */*",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://spotdown.org/",
                "Origin": "https://spotdown.org",
                "X-Session-Token": HARDCODED_TOKEN
            },
        };

        const req = https.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                try { resolve(JSON.parse(data)); } 
                catch { reject(new Error("Gagal parse respon provider.")); }
            });
        });
        req.on("error", reject);
        req.end();
    });
}

module.exports = function (app) {
    app.get("/search/spotify", async (req, res) => {
        const { q, apikey } = req.query;

        if (!apikey || apikey !== 'sitopi') {
            return res.status(403).json({ status: false, message: "invalid Apikey!" });
        }

        if (!q) {
            return res.status(400).json({ status: false, message: "Masukkan query!" });
        }

        try {
            const result = await spotdownRequest(`/api/song-details?url=${encodeURIComponent(q)}`);

            if (!result.songs || result.songs.length === 0) {
                return res.status(404).json({ status: false, message: "Lagu tidak ditemukan." });
            }

            const firstSong = result.songs[0];
            const downloadInfo = await spotdownRequest(`/api/song-details?url=${encodeURIComponent(firstSong.url)}`);

            res.json({
                status: true,
                result: {
                    search: result.songs,
                    download: downloadInfo
                }
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
