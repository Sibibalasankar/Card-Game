const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret_key_123_kazhuthai');
      
      // Attempt to load from MongoDB
      let userObj = null;
      try {
        userObj = await User.findById(decoded.id).select('-password');
      } catch (err) {
        // MongoDB error or not connected
      }

      // Fallback if MongoDB is not active
      if (!userObj && global.inMemoryUsers && global.inMemoryUsers[decoded.id]) {
        userObj = global.inMemoryUsers[decoded.id];
      }

      if (!userObj) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      req.user = userObj;
      next();
    } catch (error) {
      console.error('Auth verification error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
