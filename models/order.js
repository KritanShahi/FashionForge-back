const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // References the User model
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // References the Product model
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }, // To store the product price at the time of order
      },
    ],
    name: { type: String, required: true },  
    total: { type: Number, required: true }, // Total price of the order
    status: { 
      type: String, 
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], 
      default: 'Pending' 
    }, // Improved status field with enum
    shippingAddress: { 
      type: String, 
      required: true 
    }, // Optional: Add delivery address
    contactNumber: { 
      type: String, 
      required: true 
    },
    deliveryDate: { 
        type: Date, 
        required: false, // Delivery date is optional
      },  // Optional: Add contact number
  },
  { timestamps: true } // Auto-created "createdAt" and "updatedAt" fields
);

module.exports =
  mongoose.models.Order ||
  mongoose.model("Order", orderSchema);


