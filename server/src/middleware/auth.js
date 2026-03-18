const { createClient } = require('@supabase/supabase-js');
const { verifyKidToken, decodeTokenType } = require('./kidAuth');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Check if this is a kid JWT (issued by our server)
    if (decodeTokenType(token) === 'kid') {
      const payload = verifyKidToken(token);
      if (!payload) {
        return res.status(401).json({ error: 'Invalid or expired kid token' });
      }
      req.user = { id: payload.sub, type: 'kid' };
      return next();
    }

    // Otherwise, validate as a Supabase JWT
    if (!supabase) {
      console.warn('[Auth] Supabase not configured — using mock user for development.');
      req.user = { id: 'mock-user-id', email: 'dev@kidsedu.app' };
      return next();
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Supabase sometimes omits email from getUser(); fall back to JWT claim
    if (!user.email) {
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
        console.log('[Auth] getUser returned no email. JWT payload keys:', Object.keys(payload));
        console.log('[Auth] user_metadata:', JSON.stringify(user.user_metadata));
        console.log('[Auth] identities:', JSON.stringify(user.identities));
        user.email = payload.email || payload.email_claim || payload.user_metadata?.email
          || user.user_metadata?.email || user.identities?.[0]?.identity_data?.email;
      } catch (e) {
        console.error('[Auth] JWT decode failed:', e.message);
      }
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth] Verification error:', err.message);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

module.exports = { requireAuth };
