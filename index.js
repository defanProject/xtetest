const express = require("express");
const chalk = require("chalk");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const nodemailer = require("nodemailer");
const multer = require("multer");
const cookieParser = require("cookie-parser");
const session = require("express-session");
require("dotenv").config();

const authRoutes      = require("./src/routes/auth");
const dashboardRoutes = require("./src/routes/dashboard");
const adminRoutes     = require("./src/routes/admin");
const { apiKeyMiddleware } = require("./src/middleware/apiKey");

const app = express();
const PORT = process.env.PORT || 4000;

const WEBHOOK_URL = "https://discord.com/api/webhooks/1475655302383665213/U5FwGe2sMbUcujPKvq9fgLdjIO3Euf1xxsgI95fwHcaYHJ-x3VBAh_wSCENEnpK6p0h1";
const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));

async function sendWebhook(content, embeds = null) {
    if (!WEBHOOK_URL) return;
    try {
        await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(embeds ? { content: content || null, embeds } : { content })
        });
    } catch (err) {
        console.error(chalk.red(`[WebhookError] ${err.message}`));
    }
}

async function sendNotification(msg) {
    sendWebhook(msg);
}

async function sendLog({ ip, method, endpoint, status, query, duration }) {
    const icons = { request: "🟡", success: "✅", error: "❌" };
    const colors = { request: 0x7289da, success: 0x57f287, error: 0xed4245 };

    const embed = [{
        title: `${icons[status]} API Activity - ${status.toUpperCase()}`,
        color: colors[status],
        fields: [
            { name: "IP", value: `\`${ip}\``, inline: true },
            { name: "Method", value: method, inline: true },
            { name: "Endpoint", value: endpoint },
            { name: "Query", value: `\`\`\`json\n${JSON.stringify(query || {}, null, 2)}\n\`\`\`` },
            { name: "Duration", value: `${duration ?? "-"}ms`, inline: true },
            { name: "Time", value: new Date().toISOString() }
        ],
        footer: { text: "Xte API's Log System ✨" },
        timestamp: new Date()
    }];
    sendWebhook(null, embed);
}

app.enable("trust proxy");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
    origin: [process.env.BASE_URL || `http://localhost:${PORT}`, `http://localhost:${PORT}`, `http://127.0.0.1:${PORT}`],
    credentials: true,
}));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'xte-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
    },
}));
app.set("json spaces", 2);

// ── AUTH & DASHBOARD ROUTES ──
app.use("/api/auth",      authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin",     adminRoutes);

app.use("/", express.static(path.join(__dirname, "api-page")));!
app.use("/src", express.static(path.join(__dirname, "src")));

const openApiPath = path.join(__dirname, "./src/openapi.json");
let openApi = {};
try {
    openApi = JSON.parse(fs.readFileSync(openApiPath));
} catch {
    console.warn(chalk.yellow("⚠️ openapi.json not found or invalid."));
}

app.get("/openapi.json", (req, res) => {
    if (fs.existsSync(openApiPath)) res.sendFile(openApiPath);
    else res.status(404).json({ status: false, message: "openapi.json tidak ditemukan" });
});

function matchOpenApiPath(requestPath) {
    const paths = Object.keys(openApi.paths || {});
    for (const apiPath of paths) {
        const regex = new RegExp("^" + apiPath.replace(/{[^}]+}/g, "[^/]+") + "$");
        if (regex.test(requestPath)) return true;
    }
    return false;
}

app.use((req, res, next) => {
    const original = res.json;
    res.json = function (data) {
        if (typeof data === "object") {
            data = {
                status: data.status ?? true,
                creator: openApi.info?.author || "Topi",
                ...data
            };
        }
        return original.call(this, data);
    };
    next();
});

const endpointStats = {};
app.use(async (req, res, next) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const method = req.method;
    const endpoint = req.originalUrl.split("?")[0];
    const query = req.query;
    const start = Date.now();

    if (matchOpenApiPath(endpoint)) {
        sendLog({ ip, method, endpoint, status: "request", query });
        console.log(chalk.yellow(`🟡 [REQUEST] ${method} ${endpoint} | IP: ${ip}`));
    }

    res.on("finish", () => {
        if (!matchOpenApiPath(endpoint)) return;
        const duration = Date.now() - start;
        const isError = res.statusCode >= 400;
        const status = isError ? "error" : "success";

        if (!endpointStats[endpoint]) endpointStats[endpoint] = { total: 0, errors: 0, totalDuration: 0 };
        endpointStats[endpoint].total++;
        endpointStats[endpoint].totalDuration += duration;
        if (isError) endpointStats[endpoint].errors++;

        sendLog({ ip, method, endpoint, status, query, duration });
        console.log(chalk[isError ? "red" : "green"](`${isError ? "❌" : "✅"} [${status.toUpperCase()}] ${method} ${endpoint} | ${res.statusCode} | ${duration}ms`));
    });
    next();
});

// ── API KEY GUARD — semua endpoint di openapi.json wajib pakai apikey ──
app.use((req, res, next) => {
    const endpoint = req.originalUrl.split("?")[0];
    if (matchOpenApiPath(endpoint)) return apiKeyMiddleware(req, res, next);
    next();
});

TELEGRAM_TOKEN = "7478372081:AAFuoaSPHRu2dZC1lSy0zNQWL747YqaQ1UQ";
const ADMIN_CHAT_ID = "-1003273545763"; // Chat ID kamu

app.post("/api/feedback", async (req, res) => {
    try {
        const { type, email, title, description } = req.body;

        if (!email || !title || !description || !type) {
            return res.status(400).json({ status: false, message: "Semua field wajib diisi" });
        }

        const label = FEEDBACK_TYPE_LABEL[type] || type;
        const now = new Date().toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
            day: "2-digit", month: "long", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        });

        const telegramMessage = `
✨ *XTE API FEEDBACK* ✨

📅 *Waktu:* ${now} WIB
📂 *Tipe:* \`${label}\`
📧 *User:* \`${email}\`

📌 *Judul:* *${title}*

📝 *Deskripsi:*
\`\`\`
${description}
\`\`\`
        `.trim();

        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: ADMIN_CHAT_ID,
            text: telegramMessage,
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { 
                            text: "🌐 Feedback", 
                            url: "https://api.xte.web.id/feedback" 
                        }
                    ]
                ]
            }
        });

        console.log(chalk.green(`✅ [TELEGRAM] Feedback sent from ${email}`));
        res.json({ status: true, message: "Feedback berhasil dikirim" });

    } catch (err) {
        console.error(chalk.red(`❌ [TELEGRAM] Error: ${err.message}`));
        res.status(500).json({ status: false, message: "Gagal mengirim" });
    }
});

let totalRoutes = 0;
const apiFolder = path.join(__dirname, "./src/api");

if (fs.existsSync(apiFolder)) {
    fs.readdirSync(apiFolder).forEach((sub) => {
        const subPath = path.join(apiFolder, sub);
        if (fs.statSync(subPath).isDirectory()) {
            fs.readdirSync(subPath).forEach((file) => {
                if (file.endsWith(".js")) {
                    const route = require(path.join(subPath, file));
                    if (typeof route === "function") route(app);

                    totalRoutes++;
                    console.log(chalk.bgYellow.black(`Loaded Route: ${file}`));
                    sendNotification(`✅ Loaded Route: ${file}`);
                }
            });
        }
    });
}

sendNotification(`🟢 Server started. Total Routes Loaded: ${totalRoutes}`);

// ========== MAIN ROUTES ==========
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "api-page", "index.html")));
app.get("/docs", (req, res) => res.sendFile(path.join(__dirname, "api-page", "docs.html")));
app.get("/auth", (req, res) => res.sendFile(path.join(__dirname, "api-page", "auth.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "api-page", "dash.html")));
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "api-page", "admin.html")));

app.use((req, res) => res.status(404).sendFile(path.join(__dirname, "api-page", "404.html")));

app.use((err, req, res, next) => {
    console.error(err.stack);
    sendNotification(`🚨 Server Error: ${err.message}`);
    res.status(500).sendFile(path.join(__dirname, "api-page", "500.html"));
});

// ========== START ==========
app.listen(PORT, () => {
    console.log(chalk.bgGreen.black(`Server running on port ${PORT}`));
});
