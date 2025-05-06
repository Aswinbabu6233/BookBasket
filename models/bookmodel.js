const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  image: {
    data: {
      type: Buffer,
      required: true,
    },
    contentType: {
      type: String,
      required: true,
    },
  },
  description: {
    type: String,
    required: true,
  },
  genre: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    default: "English",
  },
  isbn_13: {
    type: String,
    unique: true,
    sparse: true,
  },
  isbn_10: {
    type: String,
    unique: true,
    sparse: true,
  },
  publisher: String,
  publisher_date: Date,
  binding: String,
  edition: String,
  weight: String,
  pages: Number,
  available: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Book = mongoose.model("Book", bookSchema);

module.exports = Book;
