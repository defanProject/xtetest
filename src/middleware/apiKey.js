const supabase = require('../utils/supabase');

// Cache in-memory ringan: apiKey → { userId, name, exp }
// Supaya ga hit DB tiap request
const keyCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 menit

async function apiKeyMiddleware(req, res, next) {
    // Ambil api key dari query, header, atau session
    const apiKey = req.query.apikey
        || req.query.api_key
        || req.headers['x-api-key']
        || req.session?.apiKey;

    if (!apiKey) {
        return res.status(401).json({
            status: false,
            error: 'MISSING_API_KEY',
            message: 'API key wajib disertakan. Gunakan ?apikey=xte_xxxx atau header X-Api-Key.',
        });
    }

    // Cek cache dulu
    const cached = keyCache.get(apiKey);
    if (cached && Date.now() < cached.exp) {
        req.apiUser = cached.data;
        // Simpan ke session kalau belum ada
        if (!req.session.apiKey) req.session.apiKey = apiKey;
        return next();
    }

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, api_key, is_verified, total_requests, today_requests, last_request_date')
            .eq('api_key', apiKey)
            .maybeSingle();

        if (error) throw error;

        if (!user) {
            keyCache.delete(apiKey);
            return res.status(401).json({
                status: false,
                error: 'INVALID_API_KEY',
                message: 'API key tidak valid.',
            });
        }

        if (!user.is_verified) {
            return res.status(403).json({
                status: false,
                error: 'UNVERIFIED_ACCOUNT',
                message: 'Akun belum diverifikasi.',
            });
        }

        // Simpan ke cache
        keyCache.set(apiKey, {
            data: { id: user.id, name: user.name, email: user.email },
            exp: Date.now() + CACHE_TTL,
        });

        req.apiUser = { id: user.id, name: user.name, email: user.email };

        // Simpan ke session
        if (!req.session.apiKey) req.session.apiKey = apiKey;

        // Update request count (fire and forget, jangan block response)
        incrementRequests(user).catch(err => console.error('[APIKEY] increment error:', err));

        next();
    } catch (err) {
        console.error('[APIKEY] DB error:', err.message);
        return res.status(500).json({
            status: false,
            error: 'SERVER_ERROR',
            message: 'Gagal validasi API key.',
        });
    }
}

async function incrementRequests(user) {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const isNewDay = user.last_request_date !== today;

    await supabase
        .from('users')
        .update({
            total_requests: (user.total_requests || 0) + 1,
            today_requests: isNewDay ? 1 : (user.today_requests || 0) + 1,
            last_request_date: today,
        })
        .eq('id', user.id);
}

// Hapus cache entry kalau api key di-regen
function invalidateKeyCache(apiKey) {
    keyCache.delete(apiKey);
}

module.exports = { apiKeyMiddleware, invalidateKeyCache };
