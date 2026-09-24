import { createBlueEyes } from './monsters/blueEyes.js';
import { createDarkMagician } from './monsters/darkMagician.js';

// The two cards in the prototype. Order matters: a card's index here is its target index
// in targets/cards.mind, so recompile the targets if you reorder or add cards.
export const CARDS = [
  {
    id: 'blue-eyes',
    name: 'Blue-Eyes White Dragon',
    shortName: 'Blue-Eyes',
    passcode: '89631139',
    level: 8,
    atk: 3000,
    def: 2500,
    owner: 'p1',
    image: 'assets/cards/blue-eyes.jpg',
    color: 0x7fc4ff,
    modelScale: 0.75,
    create: createBlueEyes,
  },
  {
    id: 'dark-magician',
    name: 'Dark Magician',
    shortName: 'Dark Magician',
    passcode: '46986414',
    level: 7,
    atk: 2500,
    def: 2100,
    owner: 'p2',
    image: 'assets/cards/dark-magician.jpg',
    color: 0xa98bff,
    modelScale: 0.85,
    create: createDarkMagician,
  },
];

export const PLAYERS = { p1: 'Player 1', p2: 'Player 2' };
