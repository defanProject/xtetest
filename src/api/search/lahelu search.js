const axios = require('axios');

const searchLahelu = async (query) => {
  const config = {
    method: 'get',
    url: 'https://lahelu.com/api/post/get-search',
    params: { query: query },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'
    }
  };

  try {
    const { data } = await axios(config);
    const posts = data.postInfos;

    if (!posts || posts.length === 0) {
      throw new Error("Meme tidak ditemukan");
    }

    return posts.map(item => ({
      title: item.title,
      author: item.userUsername,
      media: item.media.startsWith('http') ? item.media : `https://cache.lahelu.com/${item.media}`,
      post_id: item.postID,
      hashtags: item.hashtags || []
    }));
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = function (app) {
  app.get("/search/lahelu", async (req, res) => {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ 
        status: false, 
        message: "Query (q) is required" 
      });
    }

    try {
      const result = await searchLahelu(q);
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
