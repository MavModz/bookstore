import mongoose, { Schema } from 'mongoose';

// Define the Book schema
const BookSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true,
  },
  isbn: {
    type: String,
    required: [true, 'ISBN is required'],
    trim: true,
    unique: true,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  coverImage: {
    type: String,
    default: '/images/product/product-01.jpg',
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  purchasedAt: {
    type: Date,
    default: null,
  },
  purchasedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  purchaseLocation: {
    country: {
      type: String,
      trim: true,
    },
    latLng: {
      type: [Number],
      validate: {
        validator: function(v: number[]) {
          return v.length === 2;
        },
        message: 'latLng must be an array of two numbers [lat, lng]',
      },
    },
  },
  status: {
    type: String,
    enum: ['Available', 'Pending', 'Delivered', 'Canceled'],
    default: 'Available',
  },
}, {
  timestamps: true,
});

// Create Book model
const Book = mongoose.models.Book || mongoose.model('Book', BookSchema);

export default Book; 