const { Router } = require('express');

// Quiz option values are scent IDs so the frontend can map answers directly
// to catalog products (oud, rose, musk, original).
const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "What do you want your scent to say without a word?",
    options: [
      {
        label: "I am desired",
        value: "musk",
        description: "A warm, skin-close aura that pulls people in quietly",
      },
      {
        label: "I am powerful",
        value: "oud",
        description: "Rich, dark, and commanding — a scent that walks in before you do",
      },
      {
        label: "I am romantic",
        value: "rose",
        description: "Soft, warm blooms — feminine, tender, unforgettable up close",
      },
      {
        label: "I am mysterious",
        value: "oud",
        description: "Depth and intrigue — resins, shadow, and ancient warmth",
      },
    ],
  },
  {
    id: 2,
    question: "Which note family moves you most?",
    options: [
      {
        label: "Oud & Incense",
        value: "oud",
        description: "Ancient, smouldering, reverent — a scent with centuries behind it",
      },
      {
        label: "Amber & Vanilla",
        value: "original",
        description: "Golden, skin-like, infinitely comforting",
      },
      {
        label: "Rose & Musk",
        value: "rose",
        description: "Romantic and soft — a second skin for intimate moments",
      },
      {
        label: "Spices & Cedar",
        value: "musk",
        description: "Sharp, grounding — warm earth with a spark of heat",
      },
    ],
  },
  {
    id: 3,
    question: "When do you most want to be noticed?",
    options: [
      {
        label: "Date nights",
        value: "rose",
        description: "Close evenings when presence matters most",
      },
      {
        label: "Every single day",
        value: "musk",
        description: "A confident signature that travels with you always",
      },
      {
        label: "Special occasions",
        value: "oud",
        description: "Moments when everything needs to be exactly right",
      },
      {
        label: "Before sleep",
        value: "original",
        description: "A soft ritual — comforting notes to close the day",
      },
    ],
  },
  {
    id: 4,
    question: "How intense should your presence be?",
    options: [
      {
        label: "A secret — only for those closest to you",
        value: "musk",
        description: "Barely-there and deeply personal",
      },
      {
        label: "A signature — noticed but never loud",
        value: "original",
        description: "A quiet, consistent aura",
      },
      {
        label: "A statement — felt before you arrive",
        value: "oud",
        description: "Bold, unmistakable, unforgettable",
      },
    ],
  },
  {
    id: 5,
    question: "Solid fragrance melts with body heat at your pulse points. Where will you wear Neckline?",
    options: [
      {
        label: "Neck & collarbone",
        value: "rose",
        description: "The most personal placement — for those who lean in close",
      },
      {
        label: "Wrists & hands",
        value: "musk",
        description: "A subtle presence that follows your every gesture",
      },
      {
        label: "Behind the ears",
        value: "original",
        description: "A whisper of warmth — only detectable up close",
      },
      {
        label: "Chest & heartbeat",
        value: "oud",
        description: "Body heat amplifies everything — the deepest bloom",
      },
    ],
  },
];

const router = Router();

router.get('/', (req, res) => {
  res.json(QUIZ_QUESTIONS);
});

module.exports = router;
