const mongoose = require('mongoose');

// Comment Schema
const commentSchema = new mongoose.Schema({
  user: { type: String, required: true },
  text: { type: String, required: true },
  date: { type: Date, default: Date.now },
  replies: [new mongoose.Schema({
    user: { type: String, required: true },
    text: { type: String, required: true },
    date: { type: Date, default: Date.now }
  })]
}); 

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  comments: [commentSchema],
  favorites: { type: Number, default: 0 },
  ratedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]  
});

// Export the Product model
module.exports = mongoose.model('Product', productSchema);
