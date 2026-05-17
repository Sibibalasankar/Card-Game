const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true
  },
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    avatar: String,
    isSafe: Boolean,
    exitOrder: Number
  }],
  donkey: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String
  },
  roundsPlayed: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

let Match;
try {
  Match = mongoose.model('Match');
} catch (e) {
  Match = mongoose.model('Match', MatchSchema);
}

module.exports = Match;
