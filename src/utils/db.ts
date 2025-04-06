import fs from 'fs';
import path from 'path';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  price: number;
  description: string;
  category: string;
  coverImageUrl?: string;
  bookFileUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface Database {
  books: Book[];
}

const DB_PATH = path.join(process.cwd(), 'src/data/books.json');

// Read the database file
const readDB = (): Database => {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is empty, return empty database
    return { books: [] };
  }
};

// Write to the database file
const writeDB = (data: Database) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// Generate a unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Add a new book
export const addBook = (book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>): Book => {
  const db = readDB();
  const newBook: Book = {
    ...book,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  db.books.push(newBook);
  writeDB(db);
  return newBook;
};

// Add multiple books
export const addBooks = (books: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>[]): Book[] => {
  const db = readDB();
  const newBooks: Book[] = books.map(book => ({
    ...book,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  
  db.books.push(...newBooks);
  writeDB(db);
  return newBooks;
};

// Get all books
export const getAllBooks = (): Book[] => {
  const db = readDB();
  return db.books;
};

// Get a book by ID
export const getBookById = (id: string): Book | undefined => {
  const db = readDB();
  return db.books.find(book => book.id === id);
};

// Update a book
export const updateBook = (id: string, updates: Partial<Omit<Book, 'id' | 'createdAt' | 'updatedAt'>>): Book | undefined => {
  const db = readDB();
  const index = db.books.findIndex(book => book.id === id);
  
  if (index === -1) return undefined;
  
  db.books[index] = {
    ...db.books[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  writeDB(db);
  return db.books[index];
};

// Delete a book
export const deleteBook = (id: string): boolean => {
  const db = readDB();
  const initialLength = db.books.length;
  
  db.books = db.books.filter(book => book.id !== id);
  
  if (db.books.length === initialLength) return false;
  
  writeDB(db);
  return true;
}; 