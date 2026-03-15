const jwt = require('jsonwebtoken');

const KID_JWT_SECRET = process.env.KID_JWT_SECRET;
const KID_TOKEN_EXPIRY = '8h';

function signKidToken(kidId) {
  if (!KID_JWT_SECRET) throw new Error('KID_JWT_SECRET not configured');
  return jwt.sign({ sub: kidId, type: 'kid' }, KID_JWT_SECRET, { expiresIn: KID_TOKEN_EXPIRY });
}

function verifyKidToken(token) {
  if (!KID_JWT_SECRET) return null;
  try {
    return jwt.verify(token, KID_JWT_SECRET);
  } catch {
    return null;
  }
}

function decodeTokenType(token) {
  try {
    const decoded = jwt.decode(token);
    return decoded?.type === 'kid' ? 'kid' : 'supabase';
  } catch {
    return 'supabase';
  }
}

module.exports = { signKidToken, verifyKidToken, decodeTokenType };
