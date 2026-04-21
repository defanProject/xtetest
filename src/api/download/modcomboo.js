const axios = require("axios");

const base_url = "https://modcombo.id";
const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36";

const h = () => ({
    "user-agent": UA,
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8",
});

const clean = (s) => s?.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() ?? "";

const parseTableRows = (html) => {
    const rows = {};
    const trs = [...html.matchAll(/<tr[^>]*>(.*?)<\/tr>/gs)];
    for (const [, row] of trs) {
        const tds = [...row.matchAll(/<t[dh][^>]*>(.*?)<\/t[dh]>/gs)].map(m => clean(m[1]));
        if (tds.length >= 2 && tds[0] && tds[1]) rows[tds[0]] = tds[1];
    }
    return rows;
};

const parseDetail = (html, url) => {
    const title = clean(html.match(/<h1[^>]*>(.*?)<\/h1>/s)?.[1] ?? "");
    const ogTitle = html.match(/property="og:title"\s+content="([^"]+)"/)?.[1] ?? "";
    const description = html.match(/property="og:description"\s+content="([^"]+)"/)?.[1] ?? "";
    const icon = html.match(/src="(https:\/\/modcombo\.id\/wp-content\/uploads\/[^"]+(?:logo|icon)[^"]*150x150[^"]*\.(?:png|jpg|webp))"/i)?.[1] ?? null;
    
    const allImgs = [...html.matchAll(/src="(https:\/\/modcombo\.id\/wp-content\/uploads\/[^"]+\.(?:jpg|png|webp))"/g)].map(m => m[1]);
    const screenshots = [...new Set(allImgs)].filter(i => /MOD-?Combo/i.test(i) && !/150x150|300x300|logo/.test(i));

    const tableData = parseTableRows(html);
    const modSection = html.match(/(?:Versi MOD APK|MOD Features?)(.*?)(?:<h[23]|<footer|id="comments)/si)?.[1] ?? "";
    const modFeatures = [...modSection.matchAll(/<li[^>]*>(.*?)<\/li>/gs)]
        .map(m => clean(m[1]))
        .filter(f => f.length > 3 && f.length < 200 && !/</.test(f));

    const downloadLink = html.match(/href="([^"]+)"[^>]*class="[^"]*modradar-download-button[^"]*"/i)?.[1] ??
        html.match(/class="[^"]*modradar-download-button[^"]*"[^>]*href="([^"]+)"/i)?.[1] ?? null;

    return {
        title: title || ogTitle,
        description,
        url,
        icon,
        screenshots,
        info: {
            version: tableData["Versi"] ?? null,
            size: tableData["Kapasitas"] ?? null,
            category: tableData["Kategori"] ?? null,
            developer: tableData["Penerbit"] ?? null,
            packageName: tableData["Nama paket"] ?? null,
            updatedAt: tableData["Terakhir diperbarui"] ?? null,
        },
        modFeatures,
        downloadLink,
    };
};

const parseSearch = (html) => {
    const cards = [...html.matchAll(/<div class="custom-app-card">(.*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/gs)];
    return cards.map(([, block]) => {
        const img = block.match(/<img[^>]+src="([^"]+)"/)?.[1] ?? null;
        const url = block.match(/href="(https:\/\/modcombo\.id\/[^"]+)"/)?.[1] ?? null;
        const title = clean(block.match(/<h[23][^>]*>(.*?)<\/h[23]>/s)?.[1] ?? "");
        return { title, url, icon: img };
    }).filter(c => c.url);
};

module.exports = function (app) {
    // ENDPOINT 1: SEARCH
    app.get("/search/modcombo", async (req, res) => {
        const { q } = req.query;
        if (!q) return res.status(400).json({ status: false, message: "Query parameter 'q' is required" });

        try {
            const { data } = await axios.get(`${base_url}/?s=${encodeURIComponent(q)}`, {
                headers: h(),
                timeout: 15000
            });
            const results = parseSearch(data);
            res.status(200).json({ status: true, result: results });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });

    // ENDPOINT 2: DOWNLOAD (DETAIL)
    app.get("/download/modcombo", async (req, res) => {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, message: "URL parameter is required" });

        try {
            const { data } = await axios.get(url, {
                headers: h(),
                timeout: 15000
            });
            const result = parseDetail(data, url);
            res.status(200).json({ status: true, result });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
