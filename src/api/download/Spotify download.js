const axios = require('axios');

const downloadSpotify = async (spotifyUrl) => {
  try {
    const baseUrl = "https://spotify.downloaderize.com/";
    const pageResponse = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
      }
    });

    const nonceMatch = pageResponse.data.match(/"nonce":"([a-zA-Z0-9]+)"/);
    if (!nonceMatch) throw new Error("Could not find security nonce.");

    const params = new URLSearchParams();
    params.append('action', 'spotify_downloader_get_info');
    params.append('url', spotifyUrl);
    params.append('nonce', nonceMatch[1]);

    const { data } = await axios.post("https://spotify.downloaderize.com/wp-admin/admin-ajax.php", params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://spotify.downloaderize.com',
        'Referer': 'https://spotify.downloaderize.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
      }
    });

    if (data.success) {
      return {
        title: data.data.title,
        author: data.data.author,
        thumbnail: data.data.thumbnail,
        duration: data.data.duration,
        url: data.data.medias[0].url
      };
    } else {
      throw new Error("API response unsuccessful.");
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

module.exports = function (app) {
  app.get("/download/spotify", async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ status: false, message: "URL is required" });

    try {
      const result = await downloadSpotify(url);
      res.status(200).json({ status: true, result });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  });
};
