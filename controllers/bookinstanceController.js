const { body, validationResult } = require("express-validator")

const Book = require("../models/book")
const BookInstance = require("../models/bookinstance")

const asyncHandler = require("express-async-handler")

// Display list of all bookinstances.
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
  const allbookinstances = await BookInstance.find().populate("book").exec()

  res.render("bookinstance_list", {
    title: "Book Instance List",
    bookinstance_list: allbookinstances,
  })
})

// Display detail page for a specific bookinstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const bookinstance = await BookInstance.findById(req.params.id)
    .populate("book")
    .exec()

  if (bookinstance === null) {
    // No results.
    const err = new Error("Book copy not found")
    err.status = 404
    return next(err)
  }

  res.render("bookinstance_detail", {
    title: "Book:",
    bookinstance: bookinstance,
  })
})

// Display bookinstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec()

  res.render("bookinstance_form", {
    title: "Create Book Instance",
    book_list: allBooks,
  })
})

// Handle bookinstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req)

    // Create a bookinstance object with escaped and trimmed data.
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    })

    if (!errors.isEmpty()) {
      // There are errors.
      // Render form again with sanitized values and error messages.
      const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec()

      res.render("bookinstance_form", {
        title: "Create Book Instance",
        book_list: allBooks,
        selected_book: bookinstance.book._id,
        errors: errors.array(),
        bookinstance: bookinstance,
      })
      return
    } else {
      // Data from form is valid
      await BookInstance.save()
      res.redirect(bookinstance.url)
    }
  }),
]

// Display bookinstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
  const bookinstance = await BookInstance.findById(req.params.id)
    .populate("book")
    .exec()

  if (bookinstance == null) {
    res.redirect("catalog/bookinstances")
  }

  res.render("bookinstance_delete", {
    title: "Delete Book Instance",
    bookinstance,
  })
})

// Handle bookinstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
  await BookInstance.findByIdAndDelete(req.body.bookinstanceid)
  res.redirect("/catalog/bookinstances")
})

// Display bookinstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
  const [bookinstance, allBooks] = await Promise.all([
    BookInstance.findById(req.params.id).populate("book").exec(),
    Book.find({}, "title").sort({ title: 1 }).exec(),
  ])

  if (bookinstance == null) {
    res.redirect("/catalog/bookinstances")
  } else {
    res.render("bookinstance_form", {
      title: "Update Book Instance",
      bookinstance,
      book_list: allBooks,
      selected_book: bookinstance.book._id,
    })
  }
})

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req)

    // Create a bookinstance object with escaped and trimmed data.
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    })

    if (!errors.isEmpty()) {
      // There are errors.
      // Render form again with sanitized values and error messages.
      const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec()

      res.render("bookinstance_form", {
        title: "Update Book Instance",
        book_list: allBooks,
        selected_book: bookinstance.book._id,
        errors: errors.array(),
        bookinstance: bookinstance,
      })
      return
    } else {
      const updatedBookinstance = await BookInstance.findByIdAndUpdate(
        req.params.id,
        bookinstance,
        {}
      )
      res.redirect(updatedBookinstance.url)
    }
  }),
]
