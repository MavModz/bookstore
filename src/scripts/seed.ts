import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectToDatabase, disconnectFromDatabase } from '../lib/mongodb';
import User from '../models/User';
import Book from '../models/Book';
import Order from '../models/Order';

async function seedDatabase() {
  try {
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`MongoDB URI: ${process.env.MONGODB_URI ? 'defined' : 'undefined'}`);
    
    // Connect to database
    await connectToDatabase();
    console.log('Connected to MongoDB');

    // Clear existing data (CAUTION: this deletes all data!)
    await User.deleteMany({});
    await Book.deleteMany({});
    await Order.deleteMany({});
    console.log('Cleared existing data');

    // Seed users
    const salt = await bcrypt.genSalt(10);
    
    // Create admin user
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@kitabi-keeda.com',
      password: await bcrypt.hash('Admin@123', salt),
      role: 'admin',
      phone: '+91 98765 43210',
      bio: 'System Administrator',
      company: 'Kitabi Keeda',
      location: 'India',
      address: {
        street: '123 Main St',
        city: 'Delhi',
        state: 'Delhi',
        zipCode: '110001',
        country: 'India',
      },
      isVerified: true,
    });
    
    // Create vendor user
    const vendorUser = await User.create({
      firstName: 'Gaurav',
      lastName: 'Chauhan',
      email: 'gaurav.chauhan@techglide.in',
      password: await bcrypt.hash('Nrich@123#', salt),
      role: 'vendor',
      phone: '+91 98765 43210',
      bio: 'Book Vendor',
      company: 'Nrich Technologies',
      location: 'India',
      address: {
        street: '456 Market St',
        city: 'Delhi',
        state: 'Delhi',
        zipCode: '110001',
        country: 'India',
      },
      isVerified: true,
    });
    
    // Create regular user
    const regularUser = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'user@example.com',
      password: await bcrypt.hash('User@123', salt),
      role: 'user',
      phone: '+91 98765 12345',
      bio: 'Book Lover',
      location: 'India',
      address: {
        street: '789 Park Ave',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India',
      },
      isVerified: true,
    });
    
    console.log('Seeded users');
    
    // Seed books
    const books = await Book.create([
      {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: '9780743273565',
        description: 'A classic novel about the American Dream',
        price: 299,
        category: 'Fiction',
        stock: 15,
        vendor: vendorUser._id,
        isPublished: true,
        publishedDate: new Date('2020-01-01'),
        language: 'English',
        pageCount: 180,
      },
      {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        isbn: '9780061120084',
        description: 'A novel about racial injustice in the American South',
        price: 349,
        category: 'Fiction',
        stock: 10,
        vendor: vendorUser._id,
        isPublished: true,
        publishedDate: new Date('2020-02-15'),
        language: 'English',
        pageCount: 281,
      },
      {
        title: 'Brief History of Time',
        author: 'Stephen Hawking',
        isbn: '9780553380163',
        description: 'A landmark volume in science writing',
        price: 499,
        category: 'Science',
        stock: 8,
        vendor: vendorUser._id,
        isPublished: true,
        publishedDate: new Date('2020-03-10'),
        language: 'English',
        pageCount: 212,
      },
      {
        title: 'Atomic Habits',
        author: 'James Clear',
        isbn: '9780735211292',
        description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones',
        price: 399,
        category: 'Self-help',
        stock: 20,
        vendor: vendorUser._id,
        isPublished: true,
        publishedDate: new Date('2020-04-05'),
        language: 'English',
        pageCount: 320,
      },
      {
        title: 'The Psychology of Money',
        author: 'Morgan Housel',
        isbn: '9780857197689',
        description: 'Timeless lessons on wealth, greed, and happiness',
        price: 349,
        category: 'Business',
        stock: 12,
        vendor: vendorUser._id,
        isPublished: true,
        publishedDate: new Date('2020-05-20'),
        language: 'English',
        pageCount: 256,
      },
    ]);
    
    console.log('Seeded books');
    
    // Generate random past dates for orders
    const getPastDate = (daysAgo: number) => {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      return date;
    };
    
    // Seed orders
    await Order.create([
      {
        user: regularUser._id,
        books: [
          {
            book: books[0]._id,
            quantity: 1,
            price: books[0].price,
          }
        ],
        totalAmount: books[0].price,
        shippingAddress: {
          street: regularUser.address.street,
          city: regularUser.address.city,
          state: regularUser.address.state,
          zipCode: regularUser.address.zipCode,
          country: regularUser.address.country,
        },
        paymentMethod: 'credit_card',
        paymentDetails: {
          transactionId: 'txn_' + Math.random().toString(36).substring(2, 15),
          status: 'completed',
          paidAt: getPastDate(5),
        },
        status: 'delivered',
        statusHistory: [
          {
            status: 'pending',
            timestamp: getPastDate(5),
          },
          {
            status: 'processing',
            timestamp: getPastDate(4),
          },
          {
            status: 'shipped',
            timestamp: getPastDate(3),
          },
          {
            status: 'delivered',
            timestamp: getPastDate(1),
          }
        ],
        deliveredAt: getPastDate(1),
        createdAt: getPastDate(5),
      },
      {
        user: regularUser._id,
        books: [
          {
            book: books[1]._id,
            quantity: 1,
            price: books[1].price,
          }
        ],
        totalAmount: books[1].price,
        shippingAddress: {
          street: regularUser.address.street,
          city: regularUser.address.city,
          state: regularUser.address.state,
          zipCode: regularUser.address.zipCode,
          country: regularUser.address.country,
        },
        paymentMethod: 'debit_card',
        paymentDetails: {
          transactionId: 'txn_' + Math.random().toString(36).substring(2, 15),
          status: 'completed',
          paidAt: getPastDate(3),
        },
        status: 'shipped',
        statusHistory: [
          {
            status: 'pending',
            timestamp: getPastDate(3),
          },
          {
            status: 'processing',
            timestamp: getPastDate(2),
          },
          {
            status: 'shipped',
            timestamp: getPastDate(1),
          }
        ],
        createdAt: getPastDate(3),
      },
      {
        user: regularUser._id,
        books: [
          {
            book: books[2]._id,
            quantity: 1,
            price: books[2].price,
          }
        ],
        totalAmount: books[2].price,
        shippingAddress: {
          street: regularUser.address.street,
          city: regularUser.address.city,
          state: regularUser.address.state,
          zipCode: regularUser.address.zipCode,
          country: regularUser.address.country,
        },
        paymentMethod: 'upi',
        paymentDetails: {
          transactionId: 'txn_' + Math.random().toString(36).substring(2, 15),
          status: 'completed',
          paidAt: getPastDate(1),
        },
        status: 'processing',
        statusHistory: [
          {
            status: 'pending',
            timestamp: getPastDate(1),
          },
          {
            status: 'processing',
            timestamp: new Date(),
          }
        ],
        createdAt: getPastDate(1),
      },
    ]);
    
    console.log('Seeded orders');
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Disconnect from database
    await disconnectFromDatabase();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seed function
seedDatabase(); 