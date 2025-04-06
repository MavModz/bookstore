import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import TextArea from "../form/input/TextArea";
import FileInput from "../form/input/FileInput";
import Select from "../form/Select";
import { ChevronDownIcon } from "@/icons";
import Button from "../ui/button/Button";

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

interface EditBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
  onSave: (formData: FormData) => Promise<void>;
}

const categories = [
  { value: "fiction", label: "Fiction" },
  { value: "non-fiction", label: "Non-Fiction" },
  { value: "children", label: "Children's Books" },
  { value: "textbook", label: "Textbooks" },
  { value: "other", label: "Other" },
];

export default function EditBookModal({ isOpen, onClose, book, onSave }: EditBookModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    price: "",
    description: "",
    category: "",
    coverImage: null as File | null,
    bookFile: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        price: book.price.toString(),
        description: book.description,
        category: book.category,
        coverImage: null,
        bookFile: null,
      });
    }
  }, [book]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'coverImage' | 'bookFile') => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const formDataToSend = new FormData();
      
      // Add text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && key !== 'coverImage' && key !== 'bookFile') {
          formDataToSend.append(key, value);
        }
      });

      // Add files if they exist
      if (formData.coverImage) {
        formDataToSend.append('coverImage', formData.coverImage);
      }
      if (formData.bookFile) {
        formDataToSend.append('bookFile', formData.bookFile);
      }

      await onSave(formDataToSend);
      setMessage({ type: 'success', text: 'Book updated successfully!' });
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update book' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="mb-6">
          <h4 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
            Edit Book
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Update book details to keep your inventory up-to-date.
          </p>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-success-50 text-success-800 dark:bg-success-900/30 dark:text-success-400' 
              : 'bg-error-50 text-error-800 dark:bg-error-900/30 dark:text-error-400'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
            <div>
              <Label>Book Title</Label>
              <Input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter book title"
              />
            </div>

            <div>
              <Label>Author</Label>
              <Input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                placeholder="Enter author name"
              />
            </div>

            <div>
              <Label>ISBN</Label>
              <Input
                type="text"
                name="isbn"
                value={formData.isbn}
                onChange={handleInputChange}
                placeholder="Enter ISBN number"
              />
            </div>

            <div>
              <Label>Price (₹)</Label>
              <Input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="Enter price"
                min="0"
                step={1}
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select
                options={categories}
                placeholder="Select category"
                onChange={handleCategoryChange}
                className="dark:bg-dark-900"
              />
            </div>

            <div>
              <Label>Description</Label>
              <TextArea
                value={formData.description}
                onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                rows={2}
                placeholder="Enter book description"
              />
            </div>

            <div>
              <Label>Cover Image</Label>
              <FileInput
                onChange={(e) => handleFileChange(e, 'coverImage')}
              />
              {book?.coverImageUrl && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                  Current: {book.coverImageUrl}
                </p>
              )}
            </div>

            <div>
              <Label>Book File (PDF)</Label>
              <FileInput
                onChange={(e) => handleFileChange(e, 'bookFile')}
              />
              {book?.bookFileUrl && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                  Current: {book.bookFileUrl}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
} 