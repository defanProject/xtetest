const axios = require('axios');

/**
 * TikTok Stalker by Topi Dev
 * Source: TikWM API
 */
const fetchUser = async (username) => {
  try {
    const endpoint = `https://www.tikwm.com/api/user/info?unique_id=${encodeURIComponent(username)}`;
    const { data } = await axios.get(endpoint, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
      }
    });

    if (data.code === 0 && data.data) {
      return data.data; // Mengembalikan objek user info yang lengkap
    } else {
      throw new Error(data.msg || "User tidak ditemukan");
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = function (app) {
  app.get("/stalk/tiktok", async (req, res) => {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ 
        status: false, 
        message: "Username TikTok wajib diisi!" 
      });
    }

    try {
      const result = await fetchUser(username);
      res.status(200).json({
        status: true,
        result: {
            user: result.user,
            stats: result.stats
        }
      });
    } catch (err) {
      res.status(500).json({ 
        status: false, 
        error: err.message 
      });
    }
  });
};
