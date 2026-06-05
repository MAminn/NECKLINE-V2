const { verifyToken } = require('../utils/tokenUtils');
const User = require('../models/User');

async function maybeAuthenticate(req, res, next) {
  try {
    const token = req.cookies?.access_token;
    if (!token) {
      return next();
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub).lean();
    if (user) {
      req.user = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      };
    }
    next();
  } catch (err) {
    // Invalid token — continue as guest
    next();
  }
}

module.exports = maybeAuthenticate;
