const { load } = require('cheerio');
const cloudscraper = require('cloudscraper');

const base_url = "https://groupsor.link";

// --- Fungsi Original (Tetap pake Cloudscraper) ---

async function warmupSession(keyword) {
    const url = `${base_url}/group/search?keyword=${encodeURIComponent(keyword)}`;
    return await cloudscraper.get(url);
}

function parseGroups(html) {
    const $ = load(html);
    const groups = [];

    $("img.image").each((_, img) => {
        const $img = $(img);
        const $anchor = $img.closest("a");
        const $container = $anchor.closest("div");
        const $info = $container.next("div.post-info");

        const name = $img.attr("alt") || "";
        const photo = $img.attr("src") || "";
        const inviteUrl = $anchor.attr("href") || "";

        const $basic = $info.find("div.post-basic-info");
        const description = $basic.find("p.descri").text().trim();
        const joinUrl = ($info.find("span.joinbtn a.joinbtn").attr("href") || "").trim();

        groups.push({
            name,
            photo,
            invite_url: inviteUrl,
            join_url: joinUrl,
            description
        });
    });

    return groups;
}

async function fetchGroups(keyword, groupNo) {
    const res = await cloudscraper.post({
        uri: `${base_url}/group/searchmore/${encodeURIComponent(keyword)}`,
        form: { group_no: groupNo },
        headers: {
            'Referer': `${base_url}/group/search?keyword=${encodeURIComponent(keyword)}`
        }
    });

    return parseGroups(res);
}

async function groupSearch(keyword, maxPages = 1) {
    const all = [];
    await warmupSession(keyword);

    for (let page = 0; page < maxPages; page++) {
        try {
            const groups = await fetchGroups(keyword, page);
            if (!groups.length) break;
            all.push(...groups);
            await new Promise((r) => setTimeout(r, 1000));
        } catch (err) {
            console.log(err);
            break;
        }
    }
    return all;
}

// --- Express Wrapper ---

module.exports = function (app) {
    // Path: /search/wagroup
    app.get("/search/wagroup", async (req, res) => {
        const { q, page } = req.query;
        if (!q) return res.status(400).json({ status: false, message: "Mau cari grup apa, Brahhh?" });

        try {
            const maxPage = page ? parseInt(page) : 1;
            const results = await groupSearch(q, maxPage);
            
            res.status(200).json({
                status: true,
                result: results
            });
        } catch (err) {
            res.status(500).json({ 
                status: false, 
                error: "Cloudflare protection is tight, try again later." 
            });
        }
    });
};
