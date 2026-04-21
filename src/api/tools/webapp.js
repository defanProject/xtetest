const axios = require('axios');

class WebToNativeClient {
  constructor() {
    this.baseURL = "https://www.webtonative.com/api/v1";
    this.defaultHeaders = {
      "accept-language": "ms-MY",
      "origin": "https://www.webtonative.com",
      "referer": "https://www.webtonative.com/",
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
    };
  }

  async buildApp({ appName, websiteUrl }) {
    const res = await axios.post(
      `${this.baseURL}/build-app-request`,
      {
        appName,
        emailId: "support@xte.web.id",
        packageId: "WEBTONATIVE_STARTER",
        websiteUrl,
        referralCode: "",
        utmInfo: { utm_source: "", utm_medium: "", utm_campaign: "", utm_term: "", utm_content: "" },
        device_type: "website",
        browser: "chrome",
      },
      { headers: this.defaultHeaders },
    );
    if (!res.data?.isSuccess) throw new Error("Build app request failed");
    return res.data;
  }

  async checkStatus(requestId) {
    const res = await axios.get(`${this.baseURL}/check-app-status`, {
      params: { requestId },
      headers: this.defaultHeaders,
    });
    return res.data;
  }
}

const client = new WebToNativeClient();

module.exports = function (app) {
  app.get("/tools/web2app", async (req, res) => {
    const { url, name, apikey } = req.query;

    if (!apikey || apikey !== 'sitopi') {
        return res.status(403).json({ status: false, message: "Invalid API Key!" });
    }

    if (!url || !name) {
        return res.status(400).json({ status: false, message: "Parameter 'url' dan 'name' wajib ada!" });
    }

    try {
      const build = await client.buildApp({ appName: name, websiteUrl: url });
      const requestId = build.requestId;

      let attempts = 0;
      const maxAttempts = 20; 

      const check = setInterval(async () => {
        try {
          attempts++;
          const status = await client.checkStatus(requestId);

          if (status.android_status === "DONE" || attempts >= maxAttempts) {
            clearInterval(check);
            res.json({
              status: true,
              result: {
                requestId,
                appName: name,
                website: url,
                android: `https://www.webtonative.com/api/v1/demo/download/${requestId}/ANDROID`,
                ios: `https://www.webtonative.com/api/v1/demo/download/${requestId}/IOS`
              }
            });
          }
        } catch (e) {
          clearInterval(check);
        }
      }, 5000);

    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  });
};
