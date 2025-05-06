var express = require("express");
var router = express.Router();
const multer = require("multer");
const Book = require("../models/bookmodel");
const User = require("../models/usermodel");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const { isAdmin } = require("../Middleware/authentication");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/login", function (req, res, next) {
  req.session.user = null; // fixed
  res.render("admin/adminlogin", {
    errors: [],
  });
});

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("admin/adminlogin", {
        errors: errors.array(),
      });
    }

    try {
      const { email, password } = req.body;
      const emailLower = email.toLowerCase(); // fixed
      const user = await User.findOne({ email: emailLower, role: "admin" });
      if (!user) {
        return res.render("admin/adminlogin", {
          errors: [{ msg: "User not found or invalid email" }], // improved
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.render("admin/adminlogin", {
          errors: [{ msg: "Invalid password" }],
        });
      }

      req.session.user = user;
      res.redirect("/admin/dashboard"); // optional: go to admin panel
    } catch (error) {
      console.error("Error logging in:", error);
      res.render("admin/adminlogin", {
        errors: [{ msg: "An error occurred while logging in." }],
      });
    }
  }
);

// GET admin dashboard
router.get("/dashboard", isAdmin, async (req, res) => {
  try {
    const books = await Book.find({});
    const users = await User.find({ role: "user" });
    const lowstockBooks = await Book.find({ quantity: { $lt: 5 } });
    const outofstockBooks = await Book.find({ quantity: 0 });

    res.render("admin/dashboard", {
      books: books,
      users: users,
      lowstockBooks: lowstockBooks,
      outofstockBooks: outofstockBooks,
      Admin: req.session.user,
    });
  } catch (error) {}
});

// GET add book form
router.get("/add-book", isAdmin, (req, res) => {
  res.render("admin/addbook", { errors: [] });
});

// POST book
router.post(
  "/add-book",
  upload.single("image"),
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("author").notEmpty().withMessage("Author is required"),
    body("genre").notEmpty().withMessage("Genre is required"),
    body("price").isNumeric().withMessage("Price must be a number"),
    body("quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
    body("description").notEmpty().withMessage("Description is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("admin/addbook", {
        errors: errors.array(),
      });
    }

    try {
      const {
        title,
        author,
        genre,
        price,
        quantity,
        description,
        language,
        isbn_13,
        isbn_10,
        publisher,
        publisher_date,
        binding,
        edition,
        weight,
        pages,
      } = req.body;

      const book = new Book({
        title,
        author,
        genre,
        price,
        quantity,
        description,
        language,
        isbn_13,
        isbn_10,
        publisher,
        publisher_date,
        binding,
        edition,
        weight,
        pages,
        image: {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        },
      });

      await book.save();
      res.redirect("/admin/dashboard"); // or wherever you list books
    } catch (error) {
      console.error("Error saving book:", error);
      res.render("admin/addbook", {
        errors: [{ msg: "An error occurred while saving the book." }],
      });
    }
  }
);

// update and edit book
router.get("/manage-books", isAdmin, async (req, res) => {
  try {
    const { minPrice, maxPrice, stock, genre, author, publisher } = req.query;

    const filter = {};

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (stock === "in") {
      filter.quantity = { $gt: 0 };
    } else if (stock === "out") {
      filter.quantity = 0;
    }

    if (genre) {
      filter.genre = { $regex: genre, $options: "i" }; // case-insensitive partial match
    }

    if (author) {
      filter.author = { $regex: author, $options: "i" };
    }

    if (publisher) {
      filter.publisher = { $regex: publisher, $options: "i" };
    }

    const books = await Book.find(filter);

    res.render("admin/managebooks", { books, errors: [] });
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).send("Server error");
  }
});

// GET edit book form
router.get("/edit-book/:id", isAdmin, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).send("Book not found");
    }
    res.render("admin/editbook", { book, errors: [] });
  } catch (error) {
    console.error("Error fetching book:", error);
    res.status(500).send("Server error");
  }
});

module.exports = router;
