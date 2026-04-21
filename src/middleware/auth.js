const { verifyAccess } = require('../utils/jwt');

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token tidak ditemukan' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = verifyAccess(token);
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'TOKEN_EXPIRED', message: 'Token sudah expired, silakan refresh' });
    }
    return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Token tidak valid' });
  }
}

module.exports = authMiddleware;
