const { createDeck, shuffleDeck, distributeCards } = require('./cardDeck');

/**
 * Rebuilds the active turn order array for the current round.
 * It starts from the current roundStarterId and loops clockwise,
 * including only active (non-safe) players.
 */
const rebuildTurnOrder = (state) => {
  const originalPlayers = state.players;
  const starterId = state.roundStarterId;
  
  // Find starter index in original players list
  let startIndex = originalPlayers.findIndex(p => p.id === starterId);
  if (startIndex === -1) startIndex = 0;

  const newTurnOrder = [];
  const len = originalPlayers.length;

  for (let i = 0; i < len; i++) {
    const player = originalPlayers[(startIndex + i) % len];
    if (!player.isSafe) {
      newTurnOrder.push(player.id);
    }
  }

  state.turnOrder = newTurnOrder;
  state.activePlayerIndex = 0; // The active starter is always index 0
};

/**
 * Initializes a new game state for a room
 * @param {Array} players - Array of players { id, name, avatar }
 */
const initGame = (players) => {
  const deck = shuffleDeck(createDeck());
  
  // Create state player structures
  const statePlayers = players.map(p => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar || 'avatar_1',
    hand: [],
    isSafe: false,
    exitOrder: null
  }));

  // Distribute cards
  const hands = distributeCards(statePlayers, deck);
  statePlayers.forEach(p => {
    p.hand = hands[p.id];
  });

  // Find player with Ace of Spades (Spades-A)
  let spadesAHolderId = null;
  statePlayers.forEach(p => {
    const hasSpadesA = p.hand.some(c => c.id === 'Spades-A');
    if (hasSpadesA) {
      spadesAHolderId = p.id;
    }
  });

  // Fallback if Spades-A not found (should never happen with 52 cards, but safe)
  if (!spadesAHolderId) {
    spadesAHolderId = statePlayers[0].id;
  }

  const spadesAHolder = statePlayers.find(p => p.id === spadesAHolderId);

  const state = {
    players: statePlayers,
    status: 'playing',
    isFirstRound: true,
    roundStarterId: spadesAHolderId,
    turnOrder: [],
    activePlayerIndex: 0,
    playedCards: [],
    openedSuit: null,
    isBreakRound: false,
    safeCount: 0,
    donkeyId: null,
    donkeyName: null,
    lastAction: `Game started! ${spadesAHolder.name} holds the Ace of Spades (♠A) and must start the game.`,
    lastRoundResult: null
  };

  rebuildTurnOrder(state);
  return state;
};

/**
 * Validates and executes a card play action
 * @param {Object} state -Authoritative game state
 * @param {String} playerId - ID of player playing the card
 * @param {String} cardId - ID of card to play (e.g. 'Spades-A')
 */
const playCard = (state, playerId, cardId) => {
  if (state.status !== 'playing') {
    throw new Error('Game is not in active playing state.');
  }

  // Verify turn
  const activeTurnPlayerId = state.turnOrder[state.activePlayerIndex];
  if (activeTurnPlayerId !== playerId) {
    throw new Error('It is not your turn to play.');
  }

  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    throw new Error('Player not found in game state.');
  }

  // Verify card ownership
  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) {
    throw new Error('You do not own that card.');
  }

  const card = player.hand[cardIndex];

  // RULE: Very First Move of the entire game MUST be Ace of Spades (♠A) by the holder
  if (state.isFirstRound && state.playedCards.length === 0) {
    if (card.id !== 'Spades-A') {
      throw new Error('STRICT FIRST MOVE RULE: The first card played in the game MUST be the Ace of Spades (♠A)!');
    }
  }

  // RULE: Follow Suit rule
  if (state.playedCards.length > 0) {
    const openedSuit = state.openedSuit;
    if (card.suit !== openedSuit) {
      // Player is trying to play a different suit.
      // Check if they have the opened suit in their hand.
      const hasOpenedSuit = player.hand.some(c => c.suit === openedSuit);
      if (hasOpenedSuit) {
        throw new Error(`You must follow suit! You have cards of the active suit (${openedSuit}) in your hand.`);
      }
    }
  }

  // Execute card play: Remove card from hand
  player.hand.splice(cardIndex, 1);

  // Add to played cards
  state.playedCards.push({
    playerId,
    playerName: player.name,
    card
  });

  // Check if it's the opening play of the round
  if (state.playedCards.length === 1) {
    state.openedSuit = card.suit;
    state.roundStarterId = playerId;
    state.lastAction = `${player.name} started the round with ${card.rank} of ${card.suit} (Opened Suit: ${card.suit}).`;
  } else {
    // Check if a BREAK has occurred
    if (card.suit !== state.openedSuit) {
      state.isBreakRound = true;
      state.lastAction = `${player.name} does not have ${state.openedSuit} and played ${card.rank} of ${card.suit}, causing a BREAK!`;
    } else {
      state.lastAction = `${player.name} followed suit with ${card.rank} of ${card.suit}.`;
    }
  }

  // Determine what happens next:
  // 1. If it's a break round, resolve immediately!
  // 2. If it's not a break, but all active players have dropped their cards, resolve immediately!
  // 3. Otherwise, proceed to the next active player.
  const activePlayersCount = state.turnOrder.length;

  if (state.isBreakRound) {
    resolveRound(state);
  } else if (state.playedCards.length === activePlayersCount) {
    resolveRound(state);
  } else {
    // Normal rotation - increment active index
    state.activePlayerIndex++;
  }

  return state;
};

/**
 * Resolves the current round (either normal clear or break collection)
 */
const resolveRound = (state) => {
  const played = state.playedCards;
  const openedSuit = state.openedSuit;

  // Filter only cards that followed the opened suit (to find highest rank)
  const followedPlays = played.filter(p => p.card.suit === openedSuit);

  // Find the highest-value card among active suit cards
  let highestPlay = followedPlays[0];
  for (let i = 1; i < followedPlays.length; i++) {
    if (followedPlays[i].card.value > highestPlay.card.value) {
      highestPlay = followedPlays[i];
    }
  }

  const highestPlayerId = highestPlay.playerId;
  const highestPlayer = state.players.find(p => p.id === highestPlayerId);
  const highestCardString = `${highestPlay.card.rank} of ${highestPlay.card.suit}`;

  let nextStarterId = highestPlayerId;

  if (state.isBreakRound) {
    // BREAK ROUND RESOLUTION:
    // The player who played the highest active-suit card collects ALL cards played in the round!
    const collectedCards = played.map(p => p.card);
    highestPlayer.hand.push(...collectedCards);

    state.lastRoundResult = {
      type: 'break',
      collectorId: highestPlayerId,
      collectorName: highestPlayer.name,
      highestCard: highestCardString,
      collectedCards: collectedCards,
      playedCards: [...played]
    };

    state.lastAction = `BREAK RESOLUTION: ${highestPlayer.name} played the highest card of the led suit (${highestCardString}) and collects all cards! ${highestPlayer.name} will start the next round.`;
    nextStarterId = highestPlayerId;
  } else {
    // NORMAL ROUND RESOLUTION:
    // All players followed suit successfully. All played cards are permanently discarded!
    const discardedCards = played.map(p => p.card);

    state.lastRoundResult = {
      type: 'normal',
      highestPlayerId: highestPlayerId,
      highestPlayerName: highestPlayer.name,
      highestCard: highestCardString,
      discardedCards: discardedCards,
      playedCards: [...played]
    };

    state.lastAction = `NORMAL RESOLUTION: All players followed suit. Discarding cards. ${highestPlayer.name} played the highest card (${highestCardString}) and will start the next round.`;
    nextStarterId = highestPlayerId;
  }

  // Update Safe Player list
  // A player becomes SAFE if they have no cards in hand, and they did NOT just collect
  state.players.forEach(p => {
    if (!p.isSafe && p.hand.length === 0) {
      p.isSafe = true;
      state.safeCount++;
      p.exitOrder = state.safeCount;
      state.lastAction += ` | 🎉 ${p.name} is now SAFE!`;
    }
  });

  // Check Game End Condition:
  // Game ends if only ONE active player remains
  const activePlayers = state.players.filter(p => !p.isSafe);
  if (activePlayers.length <= 1) {
    state.status = 'completed';
    if (activePlayers.length === 1) {
      state.donkeyId = activePlayers[0].id;
      state.donkeyName = activePlayers[0].name;
      state.lastAction += ` | 🐴 GAME OVER! ${activePlayers[0].name} has cards remaining and becomes the KAZHUTHAI!`;
    } else {
      // Extremely rare edge case where multiple players empty hands in the same normal clear
      // Assign donkey to the player who played the lowest card in the final round
      let lowestPlay = played[0];
      for (let i = 1; i < played.length; i++) {
        if (played[i].card.value < lowestPlay.card.value) {
          lowestPlay = played[i];
        }
      }
      const lowestPlayer = state.players.find(p => p.id === lowestPlay.playerId);
      state.donkeyId = lowestPlayer.id;
      state.donkeyName = lowestPlayer.name;
      state.lastAction += ` | 🐴 GAME OVER! ${lowestPlayer.name} becomes the KAZHUTHAI!`;
    }
  }

  // Reset round parameters
  state.playedCards = [];
  state.openedSuit = null;
  state.isBreakRound = false;
  state.isFirstRound = false; // Safe to set false after round 1 resolves

  // Position next starter
  if (state.status !== 'completed') {
    // If the next starter is now safe, rotate clockwise to find the next active player
    let starterIndex = state.players.findIndex(p => p.id === nextStarterId);
    while (state.players[starterIndex].isSafe) {
      starterIndex = (starterIndex + 1) % state.players.length;
    }
    state.roundStarterId = state.players[starterIndex].id;
    
    // Rebuild the active turn rotation starting from the selected starter
    rebuildTurnOrder(state);
  }
};

module.exports = {
  initGame,
  playCard,
  rebuildTurnOrder
};
