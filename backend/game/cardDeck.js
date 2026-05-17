const SUITS = ['Spades', 'Hearts', 'Diamonds', 'Clubs'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const RANK_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

/**
 * Generates a full deck of 52 cards
 */
const createDeck = () => {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        value: RANK_VALUES[rank]
      });
    }
  }
  return deck;
};

/**
 * Shuffles a card deck using Fisher-Yates algorithm
 */
const shuffleDeck = (deck) => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Distributes a shuffled deck among a list of players
 * If extra cards remain, they are distributed circularly starting from the first player.
 */
const distributeCards = (players, deck) => {
  const numPlayers = players.length;
  const cardsPerPlayer = Math.floor(deck.length / numPlayers);
  const extraCardsCount = deck.length % numPlayers;

  // Initialize hands
  const hands = {};
  players.forEach(p => {
    hands[p.id] = [];
  });

  // Distribute core cards
  let deckIndex = 0;
  for (let i = 0; i < cardsPerPlayer; i++) {
    for (let pIndex = 0; pIndex < numPlayers; pIndex++) {
      const playerId = players[pIndex].id;
      hands[playerId].push(deck[deckIndex++]);
    }
  }

  // Distribute remaining cards circularly
  for (let pIndex = 0; pIndex < extraCardsCount; pIndex++) {
    const playerId = players[pIndex].id;
    hands[playerId].push(deck[deckIndex++]);
  }

  return hands;
};

module.exports = {
  SUITS,
  RANKS,
  RANK_VALUES,
  createDeck,
  shuffleDeck,
  distributeCards
};
