const axios = require('axios');
const FormData = require('form-data');

async function scdl(url) {
    const base = 'https://convertico.com/';
    const endpoint = base + 'soundcloud-downloader/soundcloud-downloader.php';

    const headers = {
        'accept': '*/*',
        'origin': base,
        'referer': base + 'soundcloud-downloader/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    try {
        // Step 1: Fetch Info
        const formInfo = new FormData();
        formInfo.append('action', 'fetch');
        formInfo.append('url', url);

        const { data: info } = await axios.post(endpoint, formInfo, { 
            headers: { ...headers, ...formInfo.getHeaders() } 
        });

        if (!info.status) throw new Error("Gagal mengambil info lagu");

        // Step 2: Fetch Download Link
        const formDownload = new FormData();
        formDownload.append('action', 'download');
        formDownload.append('url', url);
        formDownload.append('quality', '192');
        formDownload.append('is_playlist', '0');

        const { data: dl } = await axios.post(endpoint, formDownload, { 
            headers: { ...headers, ...formDownload.getHeaders() } 
        });

        if (!dl.file_url) throw new Error("Gagal generate link download");

        const downloadUrl = base + 'soundcloud-downloader/' + dl.file_url.split('/').map(encodeURIComponent).join('/');

        return {
            title: info.title,
            uploader: info.author,
            duration: `${Math.floor(info.duration / 60)}:${String(info.duration % 60).padStart(2, '0')}`,
            views: info.view_count.toLocaleString(),
            likes: info.like_count.toLocaleString(),
            thumbnail: info.thumbnail,
            size: `${(dl.size / 1024 / 1024).toFixed(2)} MB`,
            format: dl.format,
            download_url: downloadUrl
        };
    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports = function (app) {
    app.get("/download/soundcloud", async (req, res) => {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, message: "URL parameter is required" });

        try {
            const result = await scdl(url);
            res.status(200).json({
                status: true,
                result
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
