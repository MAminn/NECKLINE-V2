const { Router } = require('express');

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "What kind of atmosphere do you want to create?",
    options: [
      { label: "Warm & Spicy", value: "spicy", description: "Rich, exotic notes that evoke warmth and mystery" },
      { label: "Deep & Musky", value: "musky", description: "Sensual, earthy tones that linger close to the skin" },
      { label: "Soft & Floral", value: "floral", description: "Delicate, romantic blooms that feel intimate" },
      { label: "Bold & Smoky", value: "smoky", description: "Dark, intense aromas that command attention" },
    ],
  },
  {
    id: 2,
    question: "When do you usually wear fragrance?",
    options: [
      { label: "Date Nights", value: "date", description: "Evening moments made for closeness" },
      { label: "Daily Ritual", value: "daily", description: "An everyday signature scent" },
      { label: "Special Events", value: "special", description: "Occasions that call for something memorable" },
      { label: "Before Sleep", value: "sleep", description: "Calming aromas for restful nights" },
    ],
  },
  {
    id: 3,
    question: "How intense do you like your scent?",
    options: [
      { label: "Subtle Whisper", value: "low", description: "Barely there — only for those closest to you" },
      { label: "Gentle Aura", value: "medium", description: "A soft cloud that surrounds you" },
      { label: "Bold Statement", value: "high", description: "A powerful presence that fills the room" },
    ],
  },
  {
    id: 4,
    question: "Which scent family speaks to you most?",
    options: [
      { label: "Oriental Spices", value: "spices", description: "Cinnamon, cardamom, and exotic warmth" },
      { label: "Woody Resins", value: "woods", description: "Sandalwood, cedar, and amber depth" },
      { label: "White Florals", value: "white floral", description: "Jasmine, tuberose, and creamy blossoms" },
      { label: "Smoky Incense", value: "incense", description: "Oud, frankincense, and dark mystique" },
    ],
  },
];

const router = Router();

router.get('/', (req, res) => {
  res.json(QUIZ_QUESTIONS);
});

module.exports = router;
