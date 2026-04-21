const axios = require('axios');

/**
 * Scraper Original OceanSaver
 * Support MP3 (128kbps) & MP4 (144p - 1080p)
 */
async function oceansaver({ url, mode = 'mp3', type = 128 }) {
    try {
        const { data: dl } = await axios.get('https://p.lbserver.xyz/ajax/download.php', {
            params: {
                copyright: '0',
                ...(mode === 'mp3' ? {
                    format: 'mp3',
                    audio_quality: String(type)
                } : {}),
                ...(mode === 'mp4' ? {
                    format: String(type)
                } : {}),
                url: url,
                api: '30de256ad09118bd6b60a13de631ae2cea6e5f9d'
            }
        });

        const prog = await new Promise((resolve, reject) => {
            let retries = 40;
            const interval = setInterval(async () => {
                try {
                    const { data: res } = await axios.get(dl.progress_url);
                    if (res.success && res.progress >= 1000) {
                        clearInterval(interval);
                        resolve({
                            status: true,
                            url: res.download_url,
                            ...(res.alternative_download_urls ? {
                                alternative: res.alternative_download_urls
                            } : {})
                        });
                    }
                } catch (e) {
                    // Silent catch for interval errors
                }

                if (--retries <= 0) {
                    clearInterval(interval);
                    reject(new Error("Gagal mendapatkan link download (Timeout)"));
                }
            }, 1500);
        });

        return {
            status: true,
            ...dl.info,
            ...prog
        };
    } catch (e) {
        return { status: false, msg: e.message };
    }
}

module.exports = function (app) {
    /**
     * Path: /download/yt
     * query: url, mode (mp3/mp4), type (quality)
     */
    app.get("/download/yt", async (req, res) => {
        const { url, mode, type } = req.query;

        if (!url || !url.includes('youtu')) {
            return res.status(400).json({ status: false, message: "Masukan Link YouTube yang valid, Brahhh!" });
        }

        const setup = {
            url: url,
            mode: mode === "mp4" ? "mp4" : "mp3",
            type: mode === "mp4" ? (type || "720") : 128
        };

        // Validasi format video
        if (setup.mode === "mp4") {
            const available = ["144", "240", "360", "720", "1080"];
            if (!available.includes(String(setup.type))) {
                return res.status(400).json({ status: false, message: `Format tersedia: ${available.join(', ')}` });
            }
        }

        try {
            const result = await oceansaver(setup);
            if (!result.status) throw new Error(result.msg);

            res.status(200).json({
                status: true,
                result: {
                    title: result.title,
                    thumbnail: result.image,
                    duration: result.duration,
                    download_url: result.url,
                    alternative: result.alternative || null
                }
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
