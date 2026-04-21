const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');

const twitterDownloader = async (link) => {
  const config = { 'url': link };
  
  try {
    const { data } = await axios.post('https://www.expertsphp.com/instagram-reels-downloader.php', qs.stringify(config), {
      headers: {
        "content-type": 'application/x-www-form-urlencoded',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      },
    });

    const $ = cheerio.load(data);
    const videoUrl = $('table.table-condensed tbody tr td video').attr('src') || 
                     $('table.table-condensed tbody tr td a[download]').attr('href');

    if (!videoUrl) throw new Error("Video tidak ditemukan, pastikan URL Twitter benar.");

    return {
      url: link,
      video: videoUrl
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

module.exports = function (app) {
  app.get("/download/twitter", async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ 
        status: false, 
        message: "Twitter URL is required" 
      });
    }

    try {
      const result = await twitterDownloader(url);
      res.status(200).json({
        status: true,
        result
      });
    } catch (err) {
      res.status(500).json({ 
        status: false, 
        error: err.message 
      });
    }
  });
};
