const axios = require('axios');

/**
 * Proxy Engine Gay Filter
 * Nembak langsung ke Siputzx biar enteng
 */
async function getGayProxy(params) {
    try {
        const query = new URLSearchParams(params).toString();
        const response = await axios.get(`https://api.siputzx.my.id/api/canvas/gay?${query}`, {
            responseType: 'arraybuffer'
        });
        return response.data;
    } catch (err) {
        throw new Error("Gagal mengambil data dari provider.");
    }
}

module.exports = function (app) {
    /**
     * Path: /canvas/gay
     */
    app.get("/canvas/gay", async (req, res) => {
        const { avatar } = req.query;

        if (!avatar) {
            return res.status(400).json({ 
                status: false, 
                message: "Mana link avatarnya?" 
            });
        }

        try {
            const buffer = await getGayProxy(req.query);
            
            res.set('Content-Type', 'image/jpeg');
            res.send(buffer);
        } catch (err) {
            res.status(500).json({ 
                status: false, 
                error: err.message 
            });
        }
    });
};
