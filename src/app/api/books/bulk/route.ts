import { NextResponse } from 'next/server';
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

// POST /api/books/bulk
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Read the CSV file content
    const text = await file.text();
    const rows = text.split('\n');
    const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validate headers
    const requiredHeaders = ['title', 'author', 'isbn', 'price', 'category', 'description'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingHeaders.join(', ')}` },
        { status: 400 }
      );
    }

    // Read current database to check for duplicates
    const db = readDB();
    const existingISBNs = new Set(db.books.map(book => book.isbn));

    // Process each row
    const books: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const errors: { row: number; error: string }[] = [];
    const skippedDuplicates: { row: number; isbn: string }[] = [];
    const processedISBNs = new Set<string>(); // Track ISBNs within the CSV

    rows.slice(1).forEach((row, index) => {
      if (!row.trim()) return; // Skip empty rows

      const values = row.split(',').map(v => v.trim());
      const bookData: Record<string, string> = {};
      
      headers.forEach((header, i) => {
        bookData[header] = values[i] || '';
      });

      // Validate required fields
      if (!bookData.title || !bookData.author || !bookData.isbn || !bookData.price || !bookData.category) {
        errors.push({
          row: index + 2,
          error: 'Missing required fields'
        });
        return;
      }

      // Validate price
      const price = parseFloat(bookData.price);
      if (isNaN(price) || price < 0) {
        errors.push({
          row: index + 2,
          error: 'Invalid price'
        });
        return;
      }

      // Check for duplicates (both in database and within CSV)
      if (existingISBNs.has(bookData.isbn) || processedISBNs.has(bookData.isbn)) {
        skippedDuplicates.push({
          row: index + 2,
          isbn: bookData.isbn
        });
        return;
      }

      // Add ISBN to processed set
      processedISBNs.add(bookData.isbn);

      books.push({
        title: bookData.title,
        author: bookData.author,
        isbn: bookData.isbn,
        price: price,
        description: bookData.description,
        category: bookData.category
      });
    });

    // Handle validation errors
    if (errors.length > 0) {
      const errorMessages = ['Validation errors:'];
      errors.forEach(error => {
        errorMessages.push(`Row ${error.row}: ${error.error}`);
      });
      
      return NextResponse.json(
        { 
          error: 'Validation errors found', 
          details: errorMessages.join('\n')
        },
        { status: 400 }
      );
    }

    // If no valid books to add
    if (books.length === 0) {
      let message = 'No books were added.';
      if (skippedDuplicates.length > 0) {
        message += '\nSkipped duplicate books:';
        skippedDuplicates.forEach(dup => {
          message += `\nRow ${dup.row}: ISBN ${dup.isbn} already exists`;
        });
      }
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }

    // Add new books to database
    const newBooks: Book[] = books.map(book => ({
      ...book,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    
    db.books.push(...newBooks);
    writeDB(db);
    
    // Prepare response message
    let message = `Successfully added ${newBooks.length} new book(s)`;
    if (skippedDuplicates.length > 0) {
      message += `\nSkipped ${skippedDuplicates.length} duplicate book(s):`;
      skippedDuplicates.forEach(dup => {
        message += `\nRow ${dup.row}: ISBN ${dup.isbn} already exists`;
      });
    }
    
    return NextResponse.json({
      message,
      addedBooks: newBooks,
      skippedCount: skippedDuplicates.length
    });
  } catch (error) {
    console.error('Error processing bulk upload:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk upload' },
      { status: 500 }
    );
  }
} 