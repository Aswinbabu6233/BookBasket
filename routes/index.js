var express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/usermodel");
var router = express.Router();
const bcrypt = require("bcrypt");
const { isAuthenticated } = require("../Middleware/authentication");

/* GET home page. */
const Book = require("../models/bookmodel");
router.get("/", async (req, res) => {
  try {
    const genreFilter = req.query.genre;
    const genres = await Book.distinct("genre");
    const count = await Book.countDocuments();
    const randomBook = await Book.findOne().skip(
      Math.floor(Math.random() * count)
    );

    let books;
    if (genreFilter && genreFilter !== "All") {
      books = await Book.find({ genre: genreFilter });
    } else {
      books = await Book.find({});
    }

    res.render("common/home", {
      book: randomBook,
      books,
      genres,
      selectedGenre: genreFilter || "All",
      userpresent: req.session.user,
      adminpresent: req.session.user && req.session.user.role === "admin",
    });
  } catch (err) {
    console.error("Error:", err);
    res.render("common/home", { book: null });
  }
});

// search

router.get("/search", async (req, res) => {
  const searchTerm = req.query.query || "";

  const query = {
    $or: [
      { title: { $regex: searchTerm, $options: "i" } },
      { genre: { $regex: searchTerm, $options: "i" } },
      { author: { $regex: searchTerm, $options: "i" } },
    ],
  };

  const books = await Book.find(query);

  res.render("common/search", {
    books,

    userpresent: req.session.user,
    adminpresent: req.session.user?.role === "admin",
    query: searchTerm,
  });
});

router.get("/Login", function (req, res, next) {
  res.render("common/login", {
    errors: [],
  });
});
router.post(
  "/Login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("common/login", {
        errors: errors.array(),
      });
    }

    try {
      const { email, password } = req.body;
      const emaillower = email.toLowerCase();
      const user = await User.findOne({ email: emaillower, role: "user" });
      if (!user) {
        return res.render("common/login", {
          errors: [{ msg: "User not Found Invalid Emai" }],
        });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.render("common/login", {
          errors: [{ msg: "Invalid password" }],
        });
      }
      req.session.user = user;
      res.redirect("/");
    } catch (error) {
      console.error("Error logging in:", error);
      res.render("common/login", {
        errors: [{ msg: "An error occurred while logging in." }],
      });
    }
  }
);

router.get("/Signup", function (req, res, next) {
  res.render("common/signup", {
    errors: [],
  });
});

router.post(
  "/Signup",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isStrongPassword()
      .withMessage(
        "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character"
      ),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
    body("phoneNumber")
      .isLength({ min: 10, max: 10 })
      .withMessage("Phone number must be exactly 10 digits")
      .isNumeric()
      .withMessage("Phone number must contain only numbers"),
    body("address").notEmpty().withMessage("Address is required"),
    body("zipCode")
      .isLength({ min: 6, max: 6 })
      .withMessage("Zip code must be exactly 6 digits")
      .isNumeric()
      .withMessage("Zip code must contain only numbers"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("common/signup", {
        errors: errors.array(),
      });
    }
    // Check if the email already exists
    const { email } = req.body;
    const existingUser = await User.find({ email });
    if (existingUser.length > 0) {
      return res.render("common/signup", {
        errors: [{ msg: "Email already exists" }],
      });
    }

    try {
      const { name, email, password, phoneNumber, address, zipCode } = req.body;
      const hashedpassword = await bcrypt.hash(password, 10);
      const newuser = new User({
        name,
        email,
        password: hashedpassword,
        phoneNumber,
        address,
        zipCode,
      });
      await newuser.save();
      req.session.user = newuser;
      res.redirect("/");
    } catch (error) {
      console.error("Error saving user :( ", error);
      res.render("common/signup", {
        errors: [{ msg: "An error occurred while creating your account." }],
      });
    }
  }
);

// bookdetail page
router.get("/book/:id", async (req, res) => {
  const userexist = req.session.user && req.session.user.role === "user";
  const user = userexist ? await User.findById(req.session.user._id) : null;
  const book = await Book.findById(req.params.id);
  const markupPercent = Math.floor(Math.random() * 31) + 20; // 20% to 50%
  const fakeOriginalPrice = book.price + (book.price * markupPercent) / 100;

  res.render("common/bookdetail", {
    book,
    user,
    fakeOriginalPrice: fakeOriginalPrice.toFixed(2),
    discountPercent: markupPercent,
  });
});

// logout
router.get("/Logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.redirect("/");
    }
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

// Profile page
router.get("/profile", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.redirect("/");
    }
    res.render("common/profile", { user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.redirect("/");
  }
});

module.exports = router;
