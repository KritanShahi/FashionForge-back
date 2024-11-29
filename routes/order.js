const express = require('express');
const router = express.Router();
const Order = require('../models/Order'); // Assuming an Order schema exists
router.post("/buy", (req, res) => {
    console.log("Received order data:", req.body);
  
    const { userId, shippingAddress, contactNumber, products, total, name } = req.body; // Add 'name' here
    
    // Validate input
    if (!userId || !shippingAddress || !contactNumber || !products || products.length === 0 || !name) {
      console.error("Validation failed:", { userId, shippingAddress, contactNumber, products, total, name });
      return res.status(400).json({ error: "All fields are required." });
    }
  
    try {
      // Example: Log product details
      products.forEach((product) => {
        const { productId, quantity } = product; // Correctly destructuring productId and quantity
        console.log(`Processing productId: ${productId}, quantity: ${quantity}`);
      });
  
      // Save order to the database (example logic)
      const order = new Order({
        userId,
        products,
        total,
        shippingAddress,
        contactNumber,
        name,  // Include 'name' when saving to database
      });
  
      order.save()
        .then(() => res.status(201).json({ message: "Order placed successfully." }))
        .catch((err) => {
          console.error("Failed to save order:", err);
          res.status(500).json({ error: "Failed to save order." });
        });
    } catch (error) {
      console.error("Error processing order:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  });
  
/*

  // Fetch all orders
router.get('/', async (req, res) => {
    try {
      const orders = await Order.find();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching orders' });
    }
  });
*/

// Fetch all orders with populated product details
router.get('/', async (req, res) => {
    try {
      const orders = await Order.find().populate('products.productId');
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching orders' });
    }
  });
  
  router.get('/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const order = await Order.findById(id)
        .populate('userId', 'name') // Populate user details (e.g., name)
        .populate('products.productId', 'name price description'); // Populate product details
  
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
  
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching order', error: error.message });
    }
  });

  /*
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { status, deliveryDate } = req.body; // Include deliveryDate in the body
  
      const updatedOrder = await Order.findByIdAndUpdate(
        id, 
        { status, deliveryDate }, 
        { new: true }
      );
  
      if (!updatedOrder) {
        return res.status(404).json({ message: 'Order not found' });
      }
  
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: 'Error updating order', error: error.message });
    }
  });
*/
router.put('/:id', async (req, res) => {
    try {
      const updatedOrder = await Order.findByIdAndUpdate(
        req.params.id,
        {
          status: req.body.status,
          deliveryDate: req.body.deliveryDate, // Ensure deliveryDate is being passed in the request
        },
        { new: true }
      );
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: 'Error updating order' });
    }
  });
  

  // Cancel an order
// In your backend route definitions (e.g., Express.js)
router.put('/:orderId/cancel', async (req, res) => {
    const { orderId } = req.params;
    try {
      // Find the order by ID and update the status to 'Cancelled'
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).send('Order not found');
      order.status = 'Cancelled';
      await order.save();
      res.status(200).send(order);
    } catch (error) {
      res.status(500).send('Error cancelling order');
    }
  });
  

  





module.exports = router;

