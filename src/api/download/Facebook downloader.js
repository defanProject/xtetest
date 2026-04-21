const axios = require('axios');
const FormData = require('form-data');

const codingindialab = async (fbUrl) => {
  let data = new FormData();
  data.append('url', fbUrl);

  const config = {
    method: 'post',
    url: 'https://codingindialab.com/video-downloader-tools/facebook-video/app/main.php',
    headers: { 
      'accept': '*/*',
      'origin': 'https://codingindialab.com',
      'referer': 'https://codingindialab.com/video-downloader-tools/facebook-video/',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
      ...data.getHeaders()
    },
    data: data
  };

  try {
    const response = await axios(config);
    if (response.data && response.data.success) {
      return response.data;
    } else {
      throw new Error("Gagal mengambil data video Facebook.");
    }
  } catch (error) {
    throw new Error(error.response ? JSON.stringify(error.response.data) : error.message);
  }
};

module.exports = function (app) {
  app.get("/download/facebook", async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ 
        status: false, 
        message: "Facebook URL is required" 
      });
    }

    try {
      const result = await codingindialab(url);
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
