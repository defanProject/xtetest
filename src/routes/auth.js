const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const router = express.Router();

const supabase = require('../utils/supabase');
const { sendOtpEmail } = require('../utils/mailer');
const { signAccess, signRefresh, verifyRefresh } = require('../utils/jwt');

// ─── HELPERS ───────────────────────────────────────────────────────────────

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function genApiKey() {
  return 'xte_' + crypto.randomBytes(24).toString('hex');
}

function isPasswordStrong(pw) {
  return (
    pw.length >= 8 &&
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /[0-9]/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
  );
}

// ─── POST /register ─────────────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'name, email, password wajib diisi' });
    }

    if (!isPasswordStrong(password)) {
      return res.status(400).json({
        error: 'WEAK_PASSWORD',
        message: 'Password minimal 8 karakter, harus ada huruf besar, kecil, angka, dan simbol',
      });
    }

    console.log(`[AUTH] Register attempt: ${email}`);

    const { data: existing } = await supabase
      .from('users')
      .select('id, is_verified')
      .eq('email', email)
      .maybeSingle();

    if (existing && existing.is_verified) {
      return res.status(409).json({ error: 'EMAIL_EXISTS', message: 'Email sudah terdaftar dan terverifikasi' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const otp_code = genOtp();
    const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    if (existing) {
      // Update user yang belum terverifikasi
      const { error } = await supabase
        .from('users')
        .update({ name, password_hash, otp_code, otp_expires_at, otp_resend_count: 0 })
        .eq('email', email);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('users')
        .insert({ name, email, password_hash, otp_code, otp_expires_at });

      if (error) {
        if (error.code === '23505') {
          return res.status(409).json({ error: 'EMAIL_EXISTS', message: 'Email sudah terdaftar' });
        }
        throw error;
      }
    }

    await sendOtpEmail(email, name, otp_code);
    console.log(`[AUTH] OTP sent to ${email}`);

    return res.json({ success: true, message: `Kode OTP telah dikirim ke ${email}` });
  } catch (err) {
    console.error('[AUTH] Register error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Gagal mendaftar, coba lagi' });
  }
});

// ─── POST /verify-otp ───────────────────────────────────────────────────────

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'email dan otp wajib diisi' });
    }

    console.log(`[AUTH] Verify OTP attempt: ${email}`);

    const { data: user, error } = await supabase
      .from('users')
      .select('id, otp_code, otp_expires_at, is_verified')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Email tidak ditemukan' });
    }

    if (user.is_verified) {
      return res.status(400).json({ error: 'ALREADY_VERIFIED', message: 'Akun sudah terverifikasi, silakan login' });
    }

    if (!user.otp_code || user.otp_code !== String(otp)) {
      return res.status(400).json({ error: 'INVALID_OTP', message: 'Kode OTP salah' });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ error: 'OTP_EXPIRED', message: 'Kode OTP sudah expired, minta kode baru' });
    }

    const api_key = genApiKey();

    const { error: updateErr } = await supabase
      .from('users')
      .update({ is_verified: true, api_key, otp_code: null, otp_expires_at: null })
      .eq('id', user.id);

    if (updateErr) throw updateErr;

    console.log(`[AUTH] Account verified: ${email} | API key generated`);

    return res.json({ success: true, message: 'Akun berhasil diverifikasi! Silakan login.' });
  } catch (err) {
    console.error('[AUTH] Verify OTP error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Gagal verifikasi, coba lagi' });
  }
});

// ─── POST /resend-otp ───────────────────────────────────────────────────────

router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'email wajib diisi' });
    }

    console.log(`[AUTH] Resend OTP: ${email}`);

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, is_verified, otp_resend_count, otp_resend_hour')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Email tidak ditemukan' });
    }

    if (user.is_verified) {
      return res.status(400).json({ error: 'ALREADY_VERIFIED', message: 'Akun sudah terverifikasi' });
    }

    // Rate limit: max 3x per jam
    const now = new Date();
    const hourStart = user.otp_resend_hour ? new Date(user.otp_resend_hour) : null;
    let count = user.otp_resend_count || 0;

    if (hourStart && now - hourStart < 3600000) {
      if (count >= 3) {
        const waitMin = Math.ceil((3600000 - (now - hourStart)) / 60000);
        return res.status(429).json({
          error: 'RATE_LIMIT',
          message: `Terlalu banyak permintaan. Coba lagi dalam ${waitMin} menit.`,
        });
      }
      count++;
    } else {
      count = 1;
    }

    const otp_code = genOtp();
    const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: updateErr } = await supabase
      .from('users')
      .update({
        otp_code,
        otp_expires_at,
        otp_resend_count: count,
        otp_resend_hour: hourStart && now - hourStart < 3600000 ? user.otp_resend_hour : now.toISOString(),
      })
      .eq('id', user.id);

    if (updateErr) throw updateErr;

    await sendOtpEmail(email, user.name, otp_code);
    console.log(`[AUTH] OTP resent to ${email} (attempt ${count}/3)`);

    return res.json({ success: true, message: `Kode OTP baru telah dikirim ke ${email}` });
  } catch (err) {
    console.error('[AUTH] Resend OTP error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Gagal kirim ulang OTP' });
  }
});

// ─── POST /login ─────────────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'email dan password wajib diisi' });
    }

    console.log(`[AUTH] Login attempt: ${email}`);

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, password_hash, is_verified, api_key')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Email atau password salah' });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        error: 'NOT_VERIFIED',
        message: 'Akun belum diverifikasi. Cek email kamu untuk kode OTP.',
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Email atau password salah' });
    }

    const payload = { sub: user.id, email: user.email, name: user.name };
    const token = signAccess(payload);
    const refreshToken = signRefresh({ sub: user.id });

    res.cookie('xte_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    console.log(`[AUTH] Login success: ${email}`);

    return res.json({
      success: true,
      token,
      user: { name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Gagal login, coba lagi' });
  }
});

// ─── POST /refresh ───────────────────────────────────────────────────────────

router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.xte_refresh;

    if (!refreshToken) {
      return res.status(401).json({ error: 'NO_REFRESH_TOKEN', message: 'Refresh token tidak ditemukan' });
    }

    let payload;
    try {
      payload = verifyRefresh(refreshToken);
    } catch {
      return res.status(401).json({ error: 'INVALID_REFRESH_TOKEN', message: 'Refresh token tidak valid atau expired' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', payload.sub)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ error: 'USER_NOT_FOUND', message: 'User tidak ditemukan' });
    }

    const newToken = signAccess({ sub: user.id, email: user.email, name: user.name });
    console.log(`[AUTH] Token refreshed for: ${user.email}`);

    return res.json({ success: true, token: newToken });
  } catch (err) {
    console.error('[AUTH] Refresh error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Gagal refresh token' });
  }
});

// ─── POST /logout ─────────────────────────────────────────────────────────────

router.post('/logout', (req, res) => {
  res.clearCookie('xte_refresh', { path: '/' });
  console.log('[AUTH] Logout — cookie cleared');
  return res.json({ success: true, message: 'Logout berhasil' });
});

module.exports = router;
