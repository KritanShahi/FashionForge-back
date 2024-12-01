const express = require('express');
const Product = require('../models/Product');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order'); 



router.get('/dashboard-stats', async (req, res) => {
  try {
    const totalCustomers = await User.countDocuments();
    if (totalCustomers === undefined) {
      throw new Error('Failed to fetch total customers');
    }

    const totalProducts = await Product.countDocuments();
    if (totalProducts === undefined) {
      throw new Error('Failed to fetch total products');
    }

    const totalProductsSold = await Order.aggregate([
      { $unwind: '$products' },
      { $group: { _id: null, totalSold: { $sum: '$products.quantity' } } },
    ]);

    if (!totalProductsSold[0]) {
      throw new Error('Failed to fetch total products sold');
    }

    const recentOrders = await Order.aggregate([
      { $sort: { createdAt: -1 } }, // Sort by the latest order
      { $limit: 5 }, // Limit to the 5 most recent orders
      {
        $lookup: {
          from: 'users', // Join with the User collection
          localField: 'userId', // Matching field in orders
          foreignField: '_id', // Matching field in users
          as: 'userDetails',
        },
      },
      { $unwind: '$userDetails' }, // Flatten the userDetails array
      {
        $project: {
          _id: 1,
          'userDetails.name': 1,    // Include 'name' from userDetails
          'userDetails.email': 1,   // Include 'email' from userDetails
          'userDetails.phone': 1,   // Include 'phone' from userDetails
          'status': 1,
        },
      },
    ]);

    // Send the response with all the data
    res.status(200).json({
      totalCustomers,
      totalProducts,
      totalProductsSold: totalProductsSold[0].totalSold,
      recentOrders, // Include the recent orders in the response
    });

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Error fetching stats', error: err.message });
  }
});



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

const rateProduct = async (req, res) => {
  try {
    const { userId, rating } = req.body;
    const product = await Product.findById(req.params.id);

    // Check if the user has already rated
    if (product.ratedUsers.includes(userId)) {
      return res.status(400).json({ message: 'You have already rated this product.' });
    }

    // Update product rating
    const newRating = ((product.rating * product.ratingCount) + rating) / (product.ratingCount + 1);
    product.rating = newRating;
    product.ratingCount += 1;
    product.ratedUsers.push(userId); // Add user ID to the list of rated users

    await product.save();
    res.status(200).json({ newRating: product.rating, newRatingCount: product.ratingCount });
  } catch (error) {
    res.status(500).json({ message: 'Error rating product', error });
  }
};




// Update a product
router.put("/:id", async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body }, 
      { new: true } 
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


/*
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
*/
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

// Rate product endpoint
router.post('/:id/rate', async (req, res) => {
  try {
    const { userId, rating } = req.body;
    const product = await Product.findById(req.params.id);

    // Check if the user has already rated
    if (product.ratedUsers.includes(userId)) {
      return res.status(400).json({ message: 'You have already rated this product.' });
    }

    // Update product rating
    const newRating = ((product.rating * product.ratingCount) + rating) / (product.ratingCount + 1);
    product.rating = newRating;
    product.ratingCount += 1;
    product.ratedUsers.push(userId); // Add user to the ratedUsers array to track ratings

    await product.save();
    res.status(200).json({ newRating: product.rating, newRatingCount: product.ratingCount });
  } catch (error) {
    res.status(500).json({ message: 'Error rating product', error });
  }
});






module.exports = router;