const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  xp: {
    type: Number,
    default: 0
  },
  coins: {
    type: Number,
    default: 1000
  },
  avatar: {
    type: String,
    default: 'avatar_1'
  },
  matchesPlayed: {
    type: Number,
    default: 0
  },
  matchesWon: {
    type: Number,
    default: 0
  },
  kazhuthaiCount: { // Times ended up as Donkey / loser
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Match password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Handle cases when mongoose isn't initialized or collection is compiled multiple times
let User;
try {
  User = mongoose.model('User');
} catch (e) {
  User = mongoose.model('User', UserSchema);
}

module.exports = User;
