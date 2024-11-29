
const express = require('express');
const Product = require('../models/Product');
const router = express.Router();



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
  
  
  // Delete a comment by ID
  router.delete('/:productId/comments/:commentId', async (req, res) => {
    const { productId, commentId } = req.params;
  
    try {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      // Filter out the comment to delete
      product.comments = product.comments.filter(comment => comment._id.toString() !== commentId);
      await product.save();
  
      res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  /*
  router.delete('/:productId/comments/:commentId', async (req, res) => {
    const { productId, commentId } = req.params;
  
    try {
      // Delete the comment from the product
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      const commentIndex = product.comments.findIndex(comment => comment.id === commentId);
      if (commentIndex === -1) {
        return res.status(404).json({ error: 'Comment not found' });
      }
  
      product.comments.splice(commentIndex, 1);  // Remove the comment
      await product.save();
  
      res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ error: 'Error deleting comment' });
    }
  });*/
  
  /*
  // Update a comment
  router.put('/:productId/comments/:commentId', async (req, res) => {
    const { productId, commentId } = req.params;
    const { text } = req.body;
  
    try {
      const product = await Product.findById(productId);
      const comment = product.comments.id(commentId);
      if (comment) {
        comment.text = text;
        await product.save();
        res.status(200).json({ message: 'Comment updated successfully' });
      } else {
        res.status(404).json({ message: 'Comment not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });*/
  
  // Example backend route for editing a comment
  router.put('/:productId/comments/:commentId', async (req, res) => {
    try {
      const { productId, commentId } = req.params;
      const { text } = req.body;
  
      // Ensure the comment text is not empty
      if (!text || text.trim() === '') {
        return res.status(400).send('Comment text cannot be empty');
      }
  
      // Find the product and update the specific comment
      const product = await Product.findById(productId);
      const comment = product.comments.id(commentId);
  
      if (comment) {
        comment.text = text; // Update the comment text
        await product.save(); // Save the updated product
        res.json(comment); // Send back the updated comment
      } else {
        res.status(404).send('Comment not found');
      }
    } catch (error) {
      res.status(500).send('Error updating comment');
    }
  });
  
  
  
  // Reply to a comment by ID
  router.post('/:productId/comments/:commentId/reply', async (req, res) => {
    const { productId, commentId } = req.params;
    const { text } = req.body; // Get the reply text from the request body
  
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Reply text is required' });
    }
  
    try {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      const comment = product.comments.id(commentId);
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }
  
      // Create a reply object
      const reply = {
        user: 'Admin', // You can set this to the admin's username
        text: text,
        date: Date.now()
      };
  
      // Assuming you want to store replies in the same comment object
      comment.replies = comment.replies || []; // Initialize replies if they don't exist
      comment.replies.push(reply);
      await product.save();
  
      res.status(201).json(reply); // Return the newly created reply
    } catch (error) {
      console.error('Error replying to comment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  //edit reply
  router.put('/:productId/comments/:commentId/replies/:replyId', async (req, res) => {
    const { productId, commentId, replyId } = req.params;
    const { text } = req.body; // Get the new reply text from the request body
  
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Reply text is required' });
    }
  
    try {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      const comment = product.comments.id(commentId);
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }
  
      const reply = comment.replies.id(replyId);
      if (!reply) {
        return res.status(404).json({ message: 'Reply not found' });
      }
  
      // Update the reply text
      reply.text = text;
      await product.save();
  
      res.status(200).json(reply); // Return the updated reply
    } catch (error) {
      console.error('Error editing reply:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  //delete reply
  
  router.delete('/:productId/comments/:commentId/replies/:replyId', async (req, res) => {
    const { productId, commentId, replyId } = req.params;
  
    try {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      const comment = product.comments.id(commentId);
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }
  
      // Filter out the reply with the specified replyId
      comment.replies = comment.replies.filter(reply => reply._id.toString() !== replyId);
  
      await product.save();
  
      res.status(204).send(); // Respond with no content
    } catch (error) {
      console.error('Error deleting reply:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  
  
  
  module.exports = router;
  