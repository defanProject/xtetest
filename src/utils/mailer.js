const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: parseInt(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function buildOtpEmail(name, otp) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Verifikasi OTP — XTE API</title>
</head>
<body style="margin:0;padding:0;background:#f8f7f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e8e4de;overflow:hidden;box-shadow:0 8px 32px rgba(232,97,26,0.10);">
        
        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#e8611a 0%,#f5905a 100%);padding:32px 36px 28px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;padding-right:12px;">
                  <div style="width:44px;height:44px;background:rgba(255,255,255,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                </td>
                <td style="vertical-align:middle;">
                  <span style="color:#fff;font-size:1.3rem;font-weight:700;letter-spacing:-0.02em;">XTE <span style="opacity:0.85;">API</span></span>
                </td>
              </tr>
            </table>
            <h1 style="color:#fff;margin:20px 0 4px;font-size:1.5rem;font-weight:700;letter-spacing:-0.02em;">Verifikasi Akun Kamu</h1>
            <p style="color:rgba(255,255,255,0.85);margin:0;font-size:0.9rem;">Halo <strong>${name}</strong>, masukkan kode OTP berikut untuk mengaktifkan akun kamu.</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:36px;">
            
            <!-- OTP BOX -->
            <div style="background:#fde8d8;border:2px dashed #e8611a;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
              <p style="margin:0 0 8px;font-size:0.78rem;font-weight:600;color:#a8683a;text-transform:uppercase;letter-spacing:0.08em;">Kode OTP Kamu</p>
              <div style="font-size:2.8rem;font-weight:800;letter-spacing:0.18em;color:#e8611a;font-family:'Courier New',monospace;line-height:1.1;">${otp}</div>
              <p style="margin:12px 0 0;font-size:0.8rem;color:#c07040;">
                ⏱ Kode berlaku <strong>10 menit</strong>
              </p>
            </div>

            <!-- INFO -->
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
              <tr>
                <td style="background:#f8f7f4;border-radius:10px;padding:16px 18px;border-left:3px solid #e8611a;">
                  <p style="margin:0;font-size:0.82rem;color:#6b6460;line-height:1.6;">
                    Jangan bagikan kode ini kepada siapapun, termasuk tim XTE API.<br>
                    Kalau kamu tidak mendaftar, abaikan email ini.
                  </p>
                </td>
              </tr>
            </table>

            <!-- DIVIDER -->
            <hr style="border:none;border-top:1px solid #e8e4de;margin:0 0 24px;"/>

            <!-- STEPS -->
            <p style="margin:0 0 12px;font-size:0.82rem;font-weight:600;color:#1c1917;">Cara verifikasi:</p>
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="vertical-align:top;padding-right:10px;padding-bottom:10px;">
                  <div style="width:24px;height:24px;background:#e8611a;border-radius:50%;color:#fff;font-size:0.7rem;font-weight:700;text-align:center;line-height:24px;">1</div>
                </td>
                <td style="font-size:0.82rem;color:#6b6460;padding-bottom:10px;">Buka halaman verifikasi XTE API</td>
              </tr>
              <tr>
                <td style="vertical-align:top;padding-right:10px;padding-bottom:10px;">
                  <div style="width:24px;height:24px;background:#e8611a;border-radius:50%;color:#fff;font-size:0.7rem;font-weight:700;text-align:center;line-height:24px;">2</div>
                </td>
                <td style="font-size:0.82rem;color:#6b6460;padding-bottom:10px;">Masukkan kode <strong style="color:#e8611a;font-family:'Courier New',monospace;">${otp}</strong></td>
              </tr>
              <tr>
                <td style="vertical-align:top;padding-right:10px;">
                  <div style="width:24px;height:24px;background:#e8611a;border-radius:50%;color:#fff;font-size:0.7rem;font-weight:700;text-align:center;line-height:24px;">3</div>
                </td>
                <td style="font-size:0.82rem;color:#6b6460;">Akun aktif, API key siap digunakan 🚀</td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f8f7f4;border-top:1px solid #e8e4de;padding:20px 36px;text-align:center;">
            <p style="margin:0 0 4px;font-size:0.75rem;color:#a8a29e;">Email ini dikirim otomatis, harap tidak dibalas.</p>
            <p style="margin:0;font-size:0.75rem;color:#a8a29e;">© ${new Date().getFullYear()} <strong style="color:#e8611a;">XTE API</strong> — All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendOtpEmail(toEmail, name, otp) {
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: toEmail,
    subject: `[XTE API] Kode OTP Verifikasi Akun — ${otp}`,
    html: buildOtpEmail(name, otp),
  });
  console.log(`[EMAIL] OTP sent to ${toEmail} | MessageId: ${info.messageId}`);
  return info;
}

module.exports = { sendOtpEmail };
