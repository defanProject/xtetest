const axios = require('axios');

const searchTiktok = async (query, count) => {
  const config = {
    method: 'post',
    url: 'https://snaptok.lol/api/tiktok/search',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'
    },
    data: {
      keywords: query,
      count: parseInt(count) || 5
    }
  };

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    throw new Error(error.response ? JSON.stringify(error.response.data) : error.message);
  }
};

module.exports = function (app) {
  app.get("/search/tiktok", async (req, res) => {
    const { q, total } = req.query;

    if (!q) {
      return res.status(400).json({ 
        status: false, 
        message: "Query (q) is required" 
      });
    }

    try {
      const result = await searchTiktok(q, total);
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
