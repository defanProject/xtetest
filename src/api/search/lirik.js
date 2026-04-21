const axios = require('axios');
const { load } = require('cheerio');

async function searchLirik(q) {
  try {
    const searchUrl = 'https://lirik.web.id/results/?q=' + encodeURIComponent(q);
    const { data: html1 } = await axios.get(searchUrl, {
      headers: { 'user-agent': 'Mozilla/5.0' }
    });

    const $1 = load(html1);
    let best = { score: 0, link: null, title: null };

    $1('span[style*="font-size"] a').each((i, el) => {
      const title = $1(el).text().trim();
      const link = $1(el).attr('href');
      const score = q.toLowerCase().split(' ').filter(word => title.toLowerCase().includes(word)).length;

      if (score > best.score) {
        best = { score, link, title };
      }
    });

    if (!best.link) return null;

    const { data: html2 } = await axios.get(best.link, {
      headers: { 'user-agent': 'Mozilla/5.0' }
    });

    const $2 = load(html2);
    const container = $2('#konten').first();
    let lyrics = '';

    container.nextAll().each((i, el) => {
      if ($2(el).attr('id') === 'konten') return false;
      const tag = el.tagName;
      if (tag === 'p' || tag === 'div') {
        lyrics += '\n' + ($2(el).html() || '');
      }
    });

    lyrics = lyrics
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/&#8220;|&#8221;/g, '"')
      .replace(/&#8217;/g, "'")
      .replace(/&#8230;/g, '...')
      .replace(/<[^>]+>/g, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    return { title: best.title, lyrics };
  } catch (err) {
    return null;
  }
}

module.exports = function (app) {
  // Langsung ke /search/lyrics
  app.get("/search/lyrics", async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ status: false, message: "Kasih judulnya, Brahhh!" });

    try {
      const result = await searchLirik(q);
      if (!result) return res.status(404).json({ status: false, message: "Lirik tidak ditemukan." });

      res.status(200).json({ status: true, result });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  });
};
