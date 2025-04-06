import mongoose from 'mongoose';

// Define the Order schema
const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  books: [{
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    price: {
      type: Number,
      required: true,
    },
  }],
  totalAmount: {
    type: Number,
    required: true,
  },
  shippingAddress: {
    street: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zipCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['credit_card', 'debit_card', 'upi', 'cash_on_delivery', 'wallet'],
  },
  paymentDetails: {
    transactionId: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paidAt: Date,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: String,
  }],
  deliveredAt: Date,
  cancelledAt: Date,
  cancelReason: String,
  trackingNumber: String,
  trackingUrl: String,
  note: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Add a method to calculate order status based on creation date
orderSchema.methods.calculateStatus = function() {
  const now = new Date();
  const creationDate = this.createdAt;
  const daysSinceCreation = Math.floor((now.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (this.status === 'cancelled') {
    return 'cancelled';
  } else if (this.status === 'delivered' || this.deliveredAt) {
    return 'delivered';
  } else if (daysSinceCreation >= 3) {
    return 'delivered';
  } else if (daysSinceCreation >= 1) {
    return 'shipped';
  } else {
    return 'pending';
  }
};

// Create Order model
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order; 