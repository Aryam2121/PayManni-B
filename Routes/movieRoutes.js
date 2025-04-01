const express = require("express");
const router = express.Router();
const upload = require("../Middleware/upload");
const movieController = require("../Controllers/movieController");

// Create a new movie with image upload
router.post("/api/movies", upload.single("image"), movieController.createMovie);

// Get all movies
router.get("/api/movies", movieController.getMovies);

// Book a movie
router.post("/api/movies/book", movieController.bookMovie);

module.exports = router;
