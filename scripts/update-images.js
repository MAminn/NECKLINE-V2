const mongoose = require('mongoose');
require('dotenv').config({ path: 'apps/api/.env' });

const productSchema = new mongoose.Schema({
  name: String, sku: String, price: Number, currency: String,
  stockOnHand: Number, category: String, tags: [String], purchasable: Boolean, images: [String]
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

async function update() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Product.updateMany({}, { $set: { images: ['/images/product.jpg'] } });
  console.log('Updated all products with image');
  await mongoose.disconnect();
}

update().catch(err => { console.error(err); process.exit(1); });
