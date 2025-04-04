const express = require("express");
const router = express.Router();
const upload = require("../Middleware/upload");
const movieController = require("../Controllers/movieController");

// Create a new movie with image upload
router.post("/createmovies", upload.single("image"), movieController.createMovie);

// Get all movies
router.get("/getAllmovies", movieController.getMovies);

// Book a movie
router.post("/movies/book", movieController.bookMovie);
// Get a single movie by ID
// router.get("/movies/:movieId", movieController.getMovieById);


module.exports = router;
