import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { NextRequest } from 'next/server';

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

const DB_FILE = path.join(process.cwd(), "src/data/books.json");

// Helper function to read the database
const readDB = (): Database => {
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return { books: [] };
  }
};

// Helper function to write to the database
const writeDB = (data: Database) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const formData = await request.formData();
    const db = readDB();
    const bookIndex = db.books.findIndex((book) => book.id === id);

    if (bookIndex === -1) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    const existingBook = db.books[bookIndex];
    const updatedBook: Book = {
      ...existingBook,
      title: formData.get("title") as string || existingBook.title,
      author: formData.get("author") as string || existingBook.author,
      isbn: formData.get("isbn") as string || existingBook.isbn,
      price: Number(formData.get("price")) || existingBook.price,
      description: formData.get("description") as string || existingBook.description,
      category: formData.get("category") as string || existingBook.category,
      updatedAt: new Date().toISOString(),
    };

    // Handle file uploads if present
    const coverImage = formData.get("coverImage") as File;
    const bookFile = formData.get("bookFile") as File;

    if (coverImage) {
      // TODO: Implement file upload logic for cover image
      // For now, we'll just keep the existing URL
      updatedBook.coverImageUrl = existingBook.coverImageUrl;
    }

    if (bookFile) {
      // TODO: Implement file upload logic for book file
      // For now, we'll just keep the existing URL
      updatedBook.bookFileUrl = existingBook.bookFileUrl;
    }

    // Update the book in the database
    db.books[bookIndex] = updatedBook;
    writeDB(db);

    return NextResponse.json(updatedBook);
  } catch (error) {
    console.error("Error updating book:", error);
    return NextResponse.json(
      { error: "Failed to update book" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const db = readDB();
    const bookIndex = db.books.findIndex((book) => book.id === id);

    if (bookIndex === -1) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    // Remove the book from the database
    db.books.splice(bookIndex, 1);
    writeDB(db);

    return NextResponse.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Error deleting book:", error);
    return NextResponse.json(
      { error: "Failed to delete book" },
      { status: 500 }
    );
  }
} 