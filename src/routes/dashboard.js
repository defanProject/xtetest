const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const supabase = require('../utils/supabase');
const { sendOtpEmail } = require('../utils/mailer');
const authMiddleware = require('../middleware/auth');
const { invalidateKeyCache } = require('../middleware/apiKey');

function genApiKey() {
  return 'xte_' + crypto.randomBytes(24).toString('hex');
}

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Semua route di sini butuh JWT
router.use(authMiddleware);

// ─── GET /me ─────────────────────────────────────────────────────────────────

router.get('/me', async (req, res) => {
  try {
    console.log(`[DASH] /me → user: ${req.user.email}`);

    const { data: user, error } = await supabase
      .from('users')
      .select('name, email, api_key, total_requests, today_requests, joined_at')
      .eq('id', req.user.sub)
      .maybeSingle();

    if (error) throw error;
    if (!user) return res.status(404).json({ error: 'NOT_FOUND', message: 'User tidak ditemukan' });

    return res.json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        api_key: user.api_key,
        total_requests: user.total_requests,
        today_requests: user.today_requests,
        joined_at: user.joined_at,
      },
    });
  } catch (err) {
    console.error('[DASH] /me error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Gagal mengambil data user' });
  }
});

// ─── PATCH /profile ───────────────────────────────────────────────────────────

router.patch('/profile', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name && !email) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Tidak ada data yang diubah' });
    }

    console.log(`[DASH] Profile update → user: ${req.user.email}`);

    const updates = {};
    if (name) updates.name = name.trim();

    if (email && email !== req.user.email) {
      // Cek apakah email sudah dipakai user lain
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', req.user.sub)
        .maybeSingle();

      if (existing) {
        return res.status(409).json({ error: 'EMAIL_TAKEN', message: 'Email sudah digunakan akun lain' });
      }

      // Ambil nama terbaru
      const { data: currentUser } = await supabase
        .from('users')
        .select('name')
        .eq('id', req.user.sub)
        .maybeSingle();

      const otp_code = genOtp();
      const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      updates.email = email;
      updates.is_verified = false;
      updates.otp_code = otp_code;
      updates.otp_expires_at = otp_expires_at;

      const { error } = await supabase.from('users').update(updates).eq('id', req.user.sub);
      if (error) throw error;

      const displayName = (updates.name || currentUser?.name) || 'Pengguna';
      await sendOtpEmail(email, displayName, otp_code);

      console.log(`[DASH] Email changed for ${req.user.email} → ${email}, OTP sent`);

      return res.json({
        success: true,
        message: 'Email diubah. Kode OTP dikirim ke email baru untuk verifikasi ulang.',
        requireVerification: true,
      });
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from('users').update(updates).eq('id', req.user.sub);
      if (error) throw error;
    }

    console.log(`[DASH] Profile updated for: ${req.user.email}`);
    return res.json({ success: true, message: 'Profil berhasil diperbarui' });
  } catch (err) {
    console.error('[DASH] Profile update error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Gagal update profil' });
  }
});

// ─── POST /regenerate-key ─────────────────────────────────────────────────────

router.post('/regenerate-key', async (req, res) => {
  try {
    console.log(`[DASH] Regenerate API key → user: ${req.user.email}`);

    const { data: oldUser } = await supabase
        .from('users')
        .select('api_key')
        .eq('id', req.user.sub)
        .maybeSingle();

    if (oldUser?.api_key) invalidateKeyCache(oldUser.api_key);

    const api_key = genApiKey();

    const { error } = await supabase
      .from('users')
      .update({ api_key })
      .eq('id', req.user.sub);

    if (error) throw error;

    console.log(`[DASH] New API key generated for: ${req.user.email}`);

    return res.json({ success: true, api_key });
  } catch (err) {
    console.error('[DASH] Regenerate key error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Gagal generate API key baru' });
  }
});

module.exports = router;
