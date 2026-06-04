const { Router } = require('express');

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "What do you want your scent to say without a word?",
    options: [
      {
        label: "I am desired",
        value: "seductive intimate",
        description: "A warm, skin-close aura that pulls people in quietly",
      },
      {
        label: "I am powerful",
        value: "bold smoky",
        description: "Rich, dark, and commanding — a scent that walks in before you do",
      },
      {
        label: "I am romantic",
        value: "floral rose",
        description: "Soft, warm blooms — feminine, tender, unforgettable up close",
      },
      {
        label: "I am mysterious",
        value: "musky incense oud",
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
        value: "oud incense smoky",
        description: "Ancient, smouldering, reverent — a scent with centuries behind it",
      },
      {
        label: "Amber & Vanilla",
        value: "amber vanilla warm",
        description: "Golden, skin-like, infinitely comforting",
      },
      {
        label: "Rose & Musk",
        value: "rose floral musk",
        description: "Romantic and soft — a second skin for intimate moments",
      },
      {
        label: "Spices & Cedar",
        value: "spicy woody cedar",
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
        value: "date intimate evening",
        description: "Close evenings when presence matters most",
      },
      {
        label: "Every single day",
        value: "daily fresh",
        description: "A confident signature that travels with you always",
      },
      {
        label: "Special occasions",
        value: "special bold",
        description: "Moments when everything needs to be exactly right",
      },
      {
        label: "Before sleep",
        value: "calm sleep",
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
        value: "low",
        description: "Barely-there and deeply personal",
      },
      {
        label: "A signature — noticed but never loud",
        value: "medium",
        description: "A quiet, consistent aura",
      },
      {
        label: "A statement — felt before you arrive",
        value: "high",
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
        value: "intimate seductive",
        description: "The most personal placement — for those who lean in close",
      },
      {
        label: "Wrists & hands",
        value: "fresh daily",
        description: "A subtle presence that follows your every gesture",
      },
      {
        label: "Behind the ears",
        value: "musky warm",
        description: "A whisper of warmth — only detectable up close",
      },
      {
        label: "Chest & heartbeat",
        value: "bold spicy amber",
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
