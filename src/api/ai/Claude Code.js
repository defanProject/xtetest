const axios = require('axios');
const FormData = require('form-data');

const getApiKey = async () => {
    try {
        const { data } = await axios.get("https://deepai.org/chat", {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36' 
            }
        });
        const match = data.match(/tryit-[\d]+-([a-f0-9]+)/);
        const r = Math.floor(1e11 * Math.random());
        return match ? `tryit-${r}-${match[1]}` : `tryit-${r}-a3edf17b505349f1794bcdbc7290a045`;
    } catch (e) {
        return `tryit-${Math.floor(1e11 * Math.random())}-a3edf17b505349f1794bcdbc7290a045`;
    }
};

const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const askClaude = async (question) => {
    try {
        const apiKey = await getApiKey();
        const formData = new FormData();
        formData.append('chat_style', 'claudeai_0');
        formData.append('chatHistory', JSON.stringify([{ role: "user", content: question }]));
        formData.append('model', 'standard');
        formData.append('session_uuid', generateUUID());
        formData.append('hacker_is_stinky', 'very_stinky');

        const { data } = await axios.post("https://api.deepai.org/hacking_is_a_serious_crime", formData, {
            headers: {
                "api-key": apiKey,
                "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
                "referer": "https://deepai.org/chat/claude-3-haiku",
                ...formData.getHeaders()
            }
        });
        return data;
    } catch (error) {
        throw new Error(error.response ? JSON.stringify(error.response.data) : error.message);
    }
};

module.exports = function (app) {
    app.get("/ai/claude", async (req, res) => {
        const { message } = req.query;
        if (!message) return res.status(400).json({ status: false, message: "Message is required" });

        try {
            const result = await askClaude(message);
            res.status(200).json({ status: true, result });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
