const axios = require("axios");
const cheerio = require("cheerio");
const https = require("https");
const vm = require("vm");

class YouPorn {
  constructor() {
    this.client = axios.create({
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });
  }

  async search(text) {
    try {
      const { data } = await this.client.get(
        `https://www.youporn.com/search/?query=${encodeURIComponent(text)}`
      );
      const $ = cheerio.load(data);
      const results = [];

      $("article.video-box").each((i, el) => {
        const article = $(el);
        const linkPath = article.find("a.video-title-text").attr("href");
        
        results.push({
          videoId: article.attr("data-video-id"),
          uploader: article.attr("data-uploader-name"),
          title: article.attr("aria-label"),
          link: linkPath ? `https://www.youporn.com${linkPath}` : null,
          views: article.find(".info-views").first().text().trim(),
          rating: article.find(".icon-pink-thumb-up").parent().text().trim()
        });
      });
      return results;
    } catch (err) {
      return [];
    }
  }

  async getVideo(videoIdOrUrl) {
    try {
      const url = videoIdOrUrl.startsWith("http")
        ? videoIdOrUrl
        : `https://www.youporn.com/watch/${videoIdOrUrl}/`;

      const { data: html } = await this.client.get(url);
      const match = html.match(/mediaDefinition\s*:\s*(\[[\s\S]*?\])/);
      if (!match) return null;

      // Gunakan VM agar lebih aman daripada eval()
      const script = new vm.Script(`result = ${match[1]}`);
      const context = { result: null };
      script.runInNewContext(context);
      const mediaDefinition = context.result;

      const mp4Endpoint = mediaDefinition.find(v => v.format === "mp4")?.videoUrl;
      const hlsEndpoint = mediaDefinition.find(v => v.format === "hls")?.videoUrl;

      const result = { mp4: [], hls: null };

      if (mp4Endpoint) {
        const { data } = await this.client.get(mp4Endpoint);
        result.mp4 = data; // Ini biasanya berisi array link kualitas (1080p, 720p, etc)
      }

      if (hlsEndpoint) {
        const { data } = await this.client.get(hlsEndpoint);
        result.hls = data;
      }

      return result;
    } catch (err) {
      return null;
    }
  }
}

const yp = new YouPorn();

module.exports = function (app) {
    // SEARCH ENDPOINT
    app.get("/search/youporn", async (req, res) => {
        const { q } = req.query;
        if (!q) return res.status(400).json({ status: false, message: "Query q diperlukan" });
        const result = await yp.search(q);
        res.status(200).json({ status: true, result });
    });

    // DOWNLOAD/GET VIDEO ENDPOINT
    app.get("/download/youporn", async (req, res) => {
        const { url, id } = req.query;
        const target = url || id;
        if (!target) return res.status(400).json({ status: false, message: "URL atau ID diperlukan" });
        
        const result = await yp.getVideo(target);
        if (!result) return res.status(404).json({ status: false, message: "Video tidak ditemukan" });
        
        res.status(200).json({ status: true, result });
    });
};
