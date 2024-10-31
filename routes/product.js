const express = require('express');
const Product = require('../models/Product');
const router = express.Router();


//CREATE
  
router.post("/",  async (req, res) => {
    const newProduct = new Product(req.body);
  
    try {
      const savedProduct = await newProduct.save();
      res.status(200).json(savedProduct);
    } catch (err) {
      res.status(500).json(err);
    }
  });

  // GET all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});


    //DELETE
    router.delete("/:id",  async (req, res) => {
        try {
          await Product.findByIdAndDelete(req.params.id);
          res.status(200).json("Product has been deleted...");
        } catch (err) {
          res.status(500).json(err);
        }
      });


// Get product details
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Product not found' });
  }
});

// Add a new comment to a product
router.post('/:id/comments', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const { user, text } = req.body;
    product.comments.push({ user, text });
    await product.save();
    res.json(product.comments);
  } catch (error) {
    res.status(500).json({ error: 'Unable to add comment' });
  }
});

// Increment product rating
router.post('/:id/rate', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const { newRating } = req.body;
    product.rating = (product.rating * product.ratingCount + newRating) / (product.ratingCount + 1);
    product.ratingCount += 1;
    await product.save();
    res.json({ rating: product.rating, ratingCount: product.ratingCount });
  } catch (error) {
    res.status(500).json({ error: 'Unable to update rating' });
  }
});

// Increment love count
router.post('/:id/love', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    product.favorites += 1;
    await product.save();
    res.json({ favorites: product.favorites });
  } catch (error) {
    res.status(500).json({ error: 'Unable to update love count' });
  }
});

module.exports = router;
