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





// PUT: Update a product
router.put("/:id", async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body }, // Use $set to update only the fields sent in the request
      { new: true } // Return the updated document instead of the old one
    );
    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
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
