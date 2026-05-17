require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Initialize database
connectDB();

// Global in-memory fallback storage
global.inMemoryUsers = global.inMemoryUsers || {};
global.inMemoryMatches = global.inMemoryMatches || [];

// Pre-fill some in-memory mock users for leaderboard demonstration
const seedInMemoryUsers = () => {
  const mockUsers = [
    { id: 'mock_user_1', username: 'Ramesh_Spades', email: 'ramesh@spades.com', xp: 2400, coins: 4500, avatar: 'avatar_2', matchesPlayed: 25, matchesWon: 14, kazhuthaiCount: 2 },
    { id: 'mock_user_2', username: 'Karthik_Hearts', email: 'karthik@hearts.com', xp: 1950, coins: 3200, avatar: 'avatar_4', matchesPlayed: 18, matchesWon: 9, kazhuthaiCount: 1 },
    { id: 'mock_user_3', username: 'Priya_Queen', email: 'priya@queen.com', xp: 1800, coins: 2800, avatar: 'avatar_5', matchesPlayed: 20, matchesWon: 8, kazhuthaiCount: 3 },
    { id: 'mock_user_4', username: 'Suresh_A', email: 'suresh@ace.com', xp: 1200, coins: 1500, avatar: 'avatar_3', matchesPlayed: 12, matchesWon: 4, kazhuthaiCount: 4 }
  ];
  mockUsers.forEach(u => {
    global.inMemoryUsers[u.id] = u;
  });
};
seedInMemoryUsers();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Models (Require models here to register Mongoose schemas)
const User = require('./models/User');
const Match = require('./models/Match');
const { protect } = require('./middleware/auth');

const COOL_NICKNAMES = [
  'SpadeMaster', 'HeartQueen', 'DiamondJoker', 'ClubKing', 'CardShark', 
  'DonkeyEscaper', 'FeltPro', 'SpadeAce', 'DonkeyKing', 'DeckShuffler',
  'CardDealer', 'WildCard', 'TrumpPlayer', 'RummyPro', 'KazhuthaiHero'
];

const generateRandomName = () => {
  const base = COOL_NICKNAMES[Math.floor(Math.random() * COOL_NICKNAMES.length)];
  const suffix = Math.floor(Math.random() * 900) + 100; // 100 to 999
  return `${base}_${suffix}`;
};

// Helper: Sign JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'jwt_secret_key_123_kazhuthai', {
    expiresIn: '30d'
  });
};

// --------------------------------------------------
// AUTHENTICATION ENDPOINTS
// --------------------------------------------------

// @route   POST /api/auth/anonymous
// @desc    Connect anonymously
app.post('/api/auth/anonymous', async (req, res) => {
  let { username, avatar } = req.body;

  // Generate a random name if none provided, or clean the provided name
  if (!username || username.trim().length < 3) {
    username = generateRandomName();
  } else {
    username = username.trim().substring(0, 15);
  }

  const avatarId = avatar || 'avatar_1';
  const anonId = Math.random().toString(36).substring(2, 11);
  const email = `anon_${anonId}@kazhuthai.com`;
  const password = `anon_password_${anonId}`;

  try {
    let newUser = null;

    try {
      // Try to create in MongoDB
      newUser = await User.create({
        username,
        email,
        password,
        avatar: avatarId
      });
      console.log(`Created anonymous user in MongoDB: ${username}`);
    } catch (dbErr) {
      // Graceful fallback to memory creation if Mongo is offline
      const userId = 'local_anon_' + anonId;
      newUser = {
        id: userId,
        username,
        email,
        avatar: avatarId,
        xp: 0,
        coins: 1000,
        matchesPlayed: 0,
        matchesWon: 0,
        kazhuthaiCount: 0,
        createdAt: new Date()
      };
      global.inMemoryUsers[userId] = newUser;
      console.log(`Created anonymous user in Local Memory (Fallback): ${username}`);
    }

    res.status(201).json({
      success: true,
      token: generateToken(newUser._id || newUser.id),
      user: {
        id: newUser._id || newUser.id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        xp: newUser.xp,
        coins: newUser.coins,
        matchesPlayed: newUser.matchesPlayed,
        matchesWon: newUser.matchesWon,
        kazhuthaiCount: newUser.kazhuthaiCount
      }
    });
  } catch (error) {
    console.error('Anonymous auth server error:', error.message);
    res.status(500).json({ success: false, message: 'Server anonymous auth error' });
  }
});


// @route   POST /api/auth/register
// @desc    Register a new user
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, avatar } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide username, email and password' });
  }

  try {
    // Attempt Mongoose DB operation
    let userExists = null;
    try {
      userExists = await User.findOne({ $or: [{ email }, { username }] });
    } catch (e) {
      // Mongo not connected, proceed to check in-memory
    }

    // In-memory check
    const inMemoryExists = Object.values(global.inMemoryUsers).some(
      u => u.email === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase()
    );

    if (userExists || inMemoryExists) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }

    let newUser = null;

    try {
      // Try database creation
      newUser = await User.create({
        username,
        email,
        password,
        avatar: avatar || 'avatar_1'
      });
      console.log(`Registered user in MongoDB: ${username}`);
    } catch (dbErr) {
      // Graceful fallback to stateful memory creation
      const userId = 'local_' + Math.random().toString(36).substring(2, 11);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      newUser = {
        id: userId,
        username,
        email: email.toLowerCase(),
        password: hashedPassword,
        avatar: avatar || 'avatar_1',
        xp: 0,
        coins: 1000,
        matchesPlayed: 0,
        matchesWon: 0,
        kazhuthaiCount: 0,
        createdAt: new Date()
      };

      global.inMemoryUsers[userId] = newUser;
      console.log(`Registered user in Local Memory (Fallback): ${username}`);
    }

    res.status(201).json({
      success: true,
      token: generateToken(newUser._id || newUser.id),
      user: {
        id: newUser._id || newUser.id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        xp: newUser.xp,
        coins: newUser.coins
      }
    });
  } catch (error) {
    console.error('Registration server error:', error.message);
    res.status(500).json({ success: false, message: 'Server registration error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  try {
    let user = null;
    let isMatch = false;

    try {
      // Try MongoDB login
      user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        isMatch = await user.matchPassword(password);
      }
    } catch (e) {
      // Mongo not connected, proceed to check in-memory
    }

    // Fallback: Check local in-memory store
    if (!user) {
      const memoryUser = Object.values(global.inMemoryUsers).find(
        u => u.email === email.toLowerCase()
      );
      if (memoryUser) {
        user = memoryUser;
        isMatch = await bcrypt.compare(password, memoryUser.password);
      }
    }

    if (!user || !isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.json({
      success: true,
      token: generateToken(user._id || user.id),
      user: {
        id: user._id || user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        xp: user.xp,
        coins: user.coins,
        matchesPlayed: user.matchesPlayed,
        matchesWon: user.matchesWon,
        kazhuthaiCount: user.kazhuthaiCount
      }
    });
  } catch (error) {
    console.error('Login server error:', error.message);
    res.status(500).json({ success: false, message: 'Server login error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
app.get('/api/auth/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id || req.user.id,
      username: req.user.username,
      email: req.user.email,
      avatar: req.user.avatar,
      xp: req.user.xp,
      coins: req.user.coins,
      matchesPlayed: req.user.matchesPlayed,
      matchesWon: req.user.matchesWon,
      kazhuthaiCount: req.user.kazhuthaiCount
    }
  });
});

// @route   POST /api/auth/profile
// @desc    Update username and avatar (Profile Rename & Change avatar)
app.post('/api/auth/profile', protect, async (req, res) => {
  const { username, avatar } = req.body;

  if (!username || username.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Display name must be at least 3 characters long.' });
  }

  const cleanName = username.trim().substring(0, 15);
  const avatarId = avatar || req.user.avatar;

  try {
    const userId = req.user._id || req.user.id;

    // Check if name is already taken (excluding themselves)
    let nameExists = false;
    
    try {
      const existingUser = await User.findOne({ 
        username: { $regex: new RegExp(`^${cleanName}$`, 'i') },
        _id: { $ne: userId }
      });
      if (existingUser) nameExists = true;
    } catch (e) {
      // DB offline, check in-memory
    }

    const inMemoryExists = Object.values(global.inMemoryUsers).some(
      u => u.username.toLowerCase() === cleanName.toLowerCase() && u.id !== userId
    );

    if (nameExists || inMemoryExists) {
      return res.status(400).json({ success: false, message: 'Username is already taken by another player.' });
    }

    let updatedUser = null;

    try {
      // Try MongoDB update
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { username: cleanName, avatar: avatarId },
        { new: true }
      ).select('-password');
      console.log(`Updated user profile in MongoDB for ${userId} -> Name: ${cleanName}`);
    } catch (dbErr) {
      // Try in-memory update
      if (global.inMemoryUsers && global.inMemoryUsers[userId]) {
        global.inMemoryUsers[userId].username = cleanName;
        global.inMemoryUsers[userId].avatar = avatarId;
        updatedUser = global.inMemoryUsers[userId];
        console.log(`Updated user profile in Local Memory for ${userId} -> Name: ${cleanName}`);
      }
    }

    if (!updatedUser) {
      // Fallback if not found anywhere but token was valid (should be req.user itself)
      req.user.username = cleanName;
      req.user.avatar = avatarId;
      updatedUser = req.user;
    }

    res.json({
      success: true,
      user: {
        id: updatedUser._id || updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        xp: updatedUser.xp,
        coins: updatedUser.coins,
        matchesPlayed: updatedUser.matchesPlayed,
        matchesWon: updatedUser.matchesWon,
        kazhuthaiCount: updatedUser.kazhuthaiCount
      }
    });
  } catch (error) {
    console.error('Update profile server error:', error.message);
    res.status(500).json({ success: false, message: 'Server update profile error' });
  }
});


// --------------------------------------------------
// GAME LOBBIES / ACTIVE ROOMS ENDPOINTS
// --------------------------------------------------

// @route   GET /api/rooms
// @desc    Get all public rooms (for room browser list)
app.get('/api/rooms', (req, res) => {
  const publicRooms = Object.values(global.rooms)
    .filter(r => !r.isPrivate && r.status === 'lobby')
    .map(r => ({
      code: r.code,
      creatorName: r.players.find(p => p.id === r.creatorId)?.name || 'Unknown',
      playerCount: r.players.length,
      status: r.status
    }));

  res.json({ success: true, rooms: publicRooms });
});

// --------------------------------------------------
// LEADERBOARD ENDPOINTS
// --------------------------------------------------

// @route   GET /api/leaderboard
// @desc    Get top players ranked by wins/XP
app.get('/api/leaderboard', async (req, res) => {
  try {
    let topPlayers = [];
    try {
      topPlayers = await User.find()
        .sort({ xp: -1 })
        .limit(10)
        .select('username avatar xp matchesPlayed matchesWon kazhuthaiCount');
    } catch (e) {
      // Mongo failed, load from local in-memory
    }

    // Merge/use in-memory users if DB is empty/failed
    if (topPlayers.length === 0) {
      topPlayers = Object.values(global.inMemoryUsers)
        .map(u => ({
          _id: u.id,
          username: u.username,
          avatar: u.avatar,
          xp: u.xp,
          matchesPlayed: u.matchesPlayed,
          matchesWon: u.matchesWon,
          kazhuthaiCount: u.kazhuthaiCount
        }))
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 10);
    }

    res.json({ success: true, leaderboard: topPlayers });
  } catch (error) {
    console.error('Leaderboard error:', error.message);
    res.status(500).json({ success: false, message: 'Server leaderboard error' });
  }
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

// Bind socket handlers
require('./game/socketHandlers')(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Kazhuthai Multiplayer Server running on port ${PORT}`);
});
