require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("../src/models/Product");

// All credentials come from the environment — no hardcoded fallbacks.
// Set this in apps/api/.env (gitignored) or your deployment's secret store.
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Missing required env var(s): MONGODB_URI");
  console.error("Set it in apps/api/.env or your secret store before seeding.");
  process.exit(1);
}

// NECKLINE catalog — dark, intimate solid perfumes.
// price is an integer in minor units (piasters): 45000 === 450.00 EGP.
const products = [
  {
    name: "Oud Noir",
    subtitle: "Smoke & resin",
    description:
      "A brooding solid perfume built on deep Cambodian oud, smoked incense, and a whisper of leather. Worn close to the skin, it lingers like a secret kept after dark.",
    sku: "NL-OUD-NOIR-15",
    price: 65000,
    currency: "EGP",
    stockOnHand: 40,
    category: "solid-perfume",
    tags: ["oud", "woody", "unisex", "signature"],
    images: ["/images/product.jpg"],
  },
  {
    name: "Rose Obscura",
    subtitle: "Velvet & thorn",
    description:
      "Damask rose absolute laid over warm amber and a trace of black pepper. Lush, romantic, and just a little dangerous — the bloom that bites back.",
    sku: "NL-ROSE-OBSCURA-15",
    price: 58000,
    currency: "EGP",
    stockOnHand: 55,
    category: "solid-perfume",
    tags: ["rose", "floral", "amber", "romantic"],
    images: ["/images/product.jpg"],
  },
  {
    name: "White Musk Veil",
    subtitle: "Skin & silence",
    description:
      "A soft, second-skin musk wrapped in clean cedar and a breath of iris. Intimate and barely-there — the scent of someone you have to lean in to notice.",
    sku: "NL-MUSK-VEIL-15",
    price: 52000,
    currency: "EGP",
    stockOnHand: 60,
    category: "solid-perfume",
    tags: ["musk", "clean", "soft", "everyday"],
    images: ["/images/product.jpg"],
  },
  {
    name: "NECKLINE Original",
    subtitle: "The house signature",
    description:
      "The scent that started it all: warm vanilla and tonka bean threaded through sandalwood and a dark amber base. Comforting, addictive, unmistakably NECKLINE.",
    sku: "NL-ORIGINAL-15",
    price: 55000,
    currency: "EGP",
    stockOnHand: 80,
    category: "solid-perfume",
    tags: ["vanilla", "amber", "signature", "bestseller"],
    images: ["/images/product.jpg"],
  },
  {
    name: "Midnight Amber",
    subtitle: "Honey & ember",
    description:
      "Golden amber melted with labdanum, a drizzle of honey, and dry tobacco leaf. A slow-burning warmth made for late nights and lingering closeness.",
    sku: "NL-AMBER-MIDNIGHT-15",
    price: 60000,
    currency: "EGP",
    stockOnHand: 45,
    category: "solid-perfume",
    tags: ["amber", "tobacco", "warm", "evening"],
    images: ["/images/product.jpg"],
  },
  {
    name: "The Intimate Collection",
    subtitle: "Gift set of three",
    description:
      "A curated trio of our most-loved solid perfumes — Oud Noir, Rose Obscura, and NECKLINE Original — boxed in matte black for gifting, or for keeping all to yourself.",
    sku: "NL-GIFT-INTIMATE-3X",
    price: 145000,
    currency: "EGP",
    stockOnHand: 25,
    category: "gift-set",
    tags: ["gift", "collection", "set", "limited"],
    images: ["/images/product.jpg"],
  },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);

  let count = 0;
  for (const product of products) {
    await Product.findOneAndUpdate(
      { sku: product.sku },
      { $set: product },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    count += 1;
  }

  console.log(`Seeded/updated ${count} products`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
