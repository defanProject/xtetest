const axios = require("axios");
const cheerio = require("cheerio");

const mediafire = async (url) => {
  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    const $ = cheerio.load(data);
    let direct = $("#downloadButton").attr("href") || $("a.input.popsok").attr("href");

    if (!direct) {
      const match = data.match(/https:\/\/download\d+\.mediafire\.com\/[^\s"'<>]+/);
      if (match) direct = match[0];
    }

    if (!direct) throw new Error("Direct link tidak ditemukan");

    const fileName = $(".dl-info .promo_caption").text().trim() || 
                     $("#downloadButton").text().replace(/Download|[\(\)\n\t]/gi, "").trim() || 
                     direct.split("/").pop();

    const fileSize = $(".dl-info .promo_caption span").text().trim() || "Unknown";

    return {
      filename: fileName,
      size: fileSize,
      direct: direct
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

module.exports = function (app) {
  app.get("/download/mediafire", async (req, res) => {
    const { url } = req.query;

    if (!url) return res.status(400).json({ status: false, message: "URL is required" });

    try {
      const result = await mediafire(url);
      res.status(200).json({
        status: true,
        result // Langsung result murni
      });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  });
};
