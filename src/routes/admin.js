const express = require('express');
const router  = express.Router();
const supabase = require('../utils/supabase');
const authMiddleware = require('../middleware/auth');

const ADMIN_EMAIL = 'defandryannn@gmail.com';

// Guard: harus login + harus email admin
function adminGuard(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Login dulu.' });
    if (req.user.email !== ADMIN_EMAIL) {
        return res.status(403).json({ error: 'FORBIDDEN', message: 'Akses ditolak.' });
    }
    next();
}

router.use(authMiddleware);
router.use(adminGuard);

// GET /api/admin/stats — ringkasan utama
router.get('/stats', async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);

        const { data: users, error } = await supabase
            .from('users')
            .select('id, name, email, is_verified, total_requests, today_requests, joined_at, last_request_date');

        if (error) throw error;

        const totalUsers      = users.length;
        const verifiedUsers   = users.filter(u => u.is_verified).length;
        const unverifiedUsers = totalUsers - verifiedUsers;
        const totalRequests   = users.reduce((s, u) => s + (parseInt(u.total_requests) || 0), 0);
        const todayRequests   = users.reduce((s, u) => s + (parseInt(u.today_requests) || 0), 0);
        const activeToday     = users.filter(u => u.last_request_date === today).length;

        // Top 5 user by total_requests
        const topUsers = [...users]
            .sort((a, b) => (b.total_requests || 0) - (a.total_requests || 0))
            .slice(0, 5)
            .map(u => ({
                name: u.name,
                email: u.email,
                total_requests: u.total_requests || 0,
                today_requests: u.today_requests || 0,
                is_verified: u.is_verified,
            }));

        // Pendaftaran per hari (30 hari terakhir)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const recentSignups = {};
        users.forEach(u => {
            if (u.joined_at >= thirtyDaysAgo) {
                const day = u.joined_at.slice(0, 10);
                recentSignups[day] = (recentSignups[day] || 0) + 1;
            }
        });

        return res.json({
            success: true,
            data: {
                totalUsers, verifiedUsers, unverifiedUsers,
                totalRequests, todayRequests, activeToday,
                topUsers, recentSignups,
            }
        });
    } catch (err) {
        console.error('[ADMIN] /stats error:', err);
        return res.status(500).json({ error: 'SERVER_ERROR', message: 'Gagal ambil stats.' });
    }
});

// GET /api/admin/users — semua user
router.get('/users', async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, name, email, is_verified, total_requests, today_requests, joined_at, last_request_date')
            .order('joined_at', { ascending: false });

        if (error) throw error;
        return res.json({ success: true, data: users });
    } catch (err) {
        console.error('[ADMIN] /users error:', err);
        return res.status(500).json({ error: 'SERVER_ERROR', message: 'Gagal ambil data user.' });
    }
});

module.exports = router;
