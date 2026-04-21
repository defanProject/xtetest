const axios = require('axios');
const cheerio = require('cheerio');

// Fungsi Utuh 1: Cek Size via Headers
async function headSize(url) {
  try {
    const { headers } = await axios.head(url);
    return headers['content-length'] ? parseInt(headers['content-length']) : null;
  } catch {
    return null;
  }
}

// Fungsi Utuh 2: Scraper Utama
async function fetchApps(term) {
  const { data } = await axios.get('https://itunes.apple.com/search', {
    params: { term, entity: 'software', limit: 5 }
  });

  const results = [];

  for (const app of data.results) {
    let trailer = null;

    try {
      const { data: html } = await axios.get(app.trackViewUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept-Language': 'id-ID,id;q=0.9'
        }
      });

      const $ = cheerio.load(html);

      $('video source').each((_, el) => {
        const src = $(el).attr('src');
        if (src?.includes('.m3u8')) trailer = src;
      });
    } catch {}

    const sizeBytes = await headSize(app.trackViewUrl);

    results.push({
      name: app.trackName,
      developer: app.sellerName,
      description: app.description,
      rating: app.averageUserRating ?? null,
      ratingCount: app.userRatingCount ?? 0,
      version: app.version,
      bundleId: app.bundleId,
      price: app.formattedPrice,
      currency: app.currency,
      size_bytes: sizeBytes,
      size_mb: sizeBytes ? (sizeBytes / 1024 / 1024).toFixed(2) : null,
      url: app.trackViewUrl,
      artwork: app.artworkUrl512,
      trailer_m3u8: trailer
    });
  }

  return results;
}

module.exports = function (app) {
  // Path: /search/appstore
  app.get("/search/appstore", async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ status: false, message: "Mau cari aplikasi apa, Brahhh?" });

    try {
      const results = await fetchApps(q);
      
      res.status(200).json({
        status: true,
        query: q,
        total_results: results.length,
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
