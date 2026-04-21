const axios = require('axios');

const stalkFF = async (uid, region = 'ID') => {
  try {
    const res = await axios.get('https://ff-817ok-topidev-172.vercel.app/player-info', {
      params: { region, uid },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'Accept': 'application/json'
      }
    });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message);
  }
};

module.exports = function (app) {
  app.get("/stalk/ff", async (req, res) => {
    const { uid, region } = req.query;

    if (!uid) {
      return res.status(400).json({ 
        status: false, 
        message: "UID is required" 
      });
    }

    try {
      const result = await stalkFF(uid, region || 'ID');
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
