const express = require("express");
const router = express.Router();

// Imports
const Survey = require("../models/Survey");
const Vote = require("../models/Vote");

// Middleware
const {
  checkExpirationDate,
  checkExpirationDateCollection,
} = require("../utilities/checkExpirationDate");
const verifyToken = require("../utilities/verifyToken");
const paginateResults = require("../utilities/pagination");

// POST /api/surveys/create
// Create Survey and Save in DB
router.post("/create", verifyToken, async (req, res) => {
  // Create survey model
  const survey = new Survey({
    title: req.body.title,
    answers: req.body.answers,
    author: req.user,
    status: req.body.status,
    multipleAnswers: req.body.multipleAnswers,
  });

  // Set survey description if there is any
  if (req.body.description !== "") {
    survey.description = req.body.description;
  }

  // Set expiration date if there is any
  if (req.body.expirationDate) {
    survey.expirationDate = req.body.expirationDate;
  }

  // Try save survey in DB
  try {
    await survey.save();
    res.status(200).json(survey);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Could not save your survey. Please try again." });
  }
});

// GET /api/surveys/get
// Get all surveys by given queries
router.get("/get", async (req, res) => {
  let query = Survey.find();

  const response = {};

  const limit = parseInt(req.query.limit);
  const page = parseInt(req.query.page);

  // Searching surveys by title
  if (req.query.title && req.query.title !== "") {
    query = query.regex("title", new RegExp(req.query.title, "i"));
  }

  // Searching surveys by author
  if (req.query.author) {
    query = query.find({ author: req.query.author });
  }

  // Searching surveys by status
  if (req.query.status) {
    query = query.find({ status: req.query.status.toString() });
  }

  // Sorting surveys
  if (req.query.sort) {
    query = query.sort({ [req.query.sort]: -1 });
  }

  // Pagination
  if (req.query.page && req.query.limit) {
    const queriedSurveysCount = await Survey.countDocuments(query).exec();
    const paginatedResults = paginateResults(queriedSurveysCount, page, limit);
    query = query.skip(paginatedResults.startIndex);

    if (paginatedResults.previous) {
      response.previous = paginatedResults.previous;
    }

    if (paginatedResults.next) {
      response.next = paginatedResults.next;
    }
  }

  // Limit results
  if (req.query.limit) {
    query = query.limit(limit);
  }
  try {
    response.results = await query.exec();
    // Check expiration date
    await checkExpirationDateCollection(response.results);
    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Could not load the resources. Please try again." });
  }
});

// GET /api/surveys/get/:id
// Get survey by id
router.get("/get/:surveyId", async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.surveyId);
    return res.status(200).json(survey);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Could not load the resources. Please try again." });
  }
});

// PUT /api/surveys/:id
// Edit survey with given id
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const survey = await Survey.findByIdAndUpdate(req.params.id, req.body);
    return res.status(200).json(survey);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Could not save your survey. Please try again." });
  }
});

// DELETE /api/surveys/:id
// Delete survey with given id
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const survey = await Survey.findByIdAndDelete(req.params.id);
    const votes = await Vote.deleteMany({ survey: req.params.id });
    return res.status(200).json({ survey, votes });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Could not delete your survey. Please try again." });
  }
});

module.exports = router;
