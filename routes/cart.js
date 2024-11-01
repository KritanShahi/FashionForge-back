const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const router = express.Router();

// Add product to cart
router.post('/:userId/add', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    let cart = await Cart.findOne({ userId: req.params.userId });
    
    if (!cart) {
      cart = new Cart({ userId: req.params.userId, items: [] });
    }

    const cartItem = cart.items.find(item => item.productId.toString() === productId);
    if (cartItem) {
      cartItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }
    
    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Unable to add to cart' });
  }
});

// Get cart details
router.get('/:userId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId }).populate('items.productId');
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Unable to retrieve cart' });
  }
});

module.exports = router;
