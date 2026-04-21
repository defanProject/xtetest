const axios = require("axios");
const cheerio = require("cheerio");

/**
 * SCRAPER ENGINE (KOMIKU)
 */
class Komik {
  constructor() {
    this.base = "https://komiku.org";
    this.api = "https://api.komiku.org";
    this.validTypes = ["manga", "manhwa", "manhua"];
  }

  fixLink(link) {
    if (!link) return null;
    return link.startsWith("http") ? link : this.base + link;
  }

  async fetch(url) {
    const { data } = await axios.get(url, { headers: { "user-agent": "Mozilla/5.0" } });
    const $ = cheerio.load(data);
    const result = [];
    $(".bge").each((i, el) => {
      result.push({
        title: $(el).find("h3").text().trim(),
        link: this.fixLink($(el).find(".bgei a").attr("href")),
        thumbnail: $(el).find("img").attr("src"),
        type: $(el).find(".tpe1_inf b").text().trim(),
        update: $(el).find(".up").text().trim(),
        description: $(el).find("p").text().trim()
      });
    });
    return result;
  }

  async home(type = "manga", page = 1) {
    const url = page === 1 ? `${this.api}/manga/?tipe=${type}` : `${this.api}/manga/page/${page}/?tipe=${type}`;
    return await this.fetch(url);
  }

  async search(query) {
    const url = `${this.api}/?post_type=manga&s=${encodeURIComponent(query)}`;
    return await this.fetch(url);
  }

  async detail(url) {
    const { data } = await axios.get(url, { headers: { "user-agent": "Mozilla/5.0" } });
    const $ = cheerio.load(data);
    const chapters = [];
    $("#Daftar_Chapter tr").each((i, el) => {
      const ch = $(el).find("td.judulseries a");
      if (ch.length) chapters.push({ title: ch.text().trim(), link: this.fixLink(ch.attr("href")), date: $(el).find("td.tanggalseries").text().trim() });
    });
    return {
      title: $("#Judul h1 span span").text().trim(),
      thumbnail: $(".ims img").attr("src"),
      description: $(".desc").text().trim(),
      genres: $(".genre li a span").map((i, el) => $(el).text().trim()).get(),
      chapters
    };
  }

  async chapter(url) {
    const { data } = await axios.get(url, { headers: { "user-agent": "Mozilla/5.0" } });
    const $ = cheerio.load(data);
    const images = [];
    $("#Baca_Komik img").each((i, el) => { images.push($(el).attr("data-src") || $(el).attr("src")); });
    return { title: $("#Judul h1").text().trim(), images };
  }
}

const engine = new Komik();

/**
 * EXPRESS ROUTES
 */
module.exports = function (app) {

  // 1. Home / Latest
  app.get("/komik/home", async (req, res) => {
    try {
      const { type, page } = req.query;
      const data = await engine.home(type || "manga", page || 1);
      res.json({ status: true, result: data });
    } catch (e) { res.json({ status: false, error: e.message }); }
  });

  // 2. Search Komik
  app.get("/komik/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) return res.json({ status: false, message: "Query 'q' mana?" });
      const data = await engine.search(q);
      res.json({ status: true, result: data });
    } catch (e) { res.json({ status: false, error: e.message }); }
  });

  // 3. Detail Komik
  app.get("/komik/detail", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url) return res.json({ status: false, message: "URL mana?" });
      const data = await engine.detail(url);
      res.json({ status: true, result: data });
    } catch (e) { res.json({ status: false, error: e.message }); }
  });

  // 4. Baca Chapter
  app.get("/komik/chapter", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url) return res.json({ status: false, message: "URL Chapter mana?" });
      const data = await engine.chapter(url);
      res.json({ status: true, result: data });
    } catch (e) { res.json({ status: false, error: e.message }); }
  });

};
