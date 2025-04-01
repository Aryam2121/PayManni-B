// controllers/movieController.js
const Movie = require("../models/Movie");

// Get all movies
const getMovies = async (req, res) => {
  try {
    const movies = await Movie.find();
    res.status(200).json({ success: true, movies });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch movies" });
  }
};

// Create a new movie with image upload
const createMovie = async (req, res) => {
  try {
    const { title, description, duration, price, seatsAvailable } = req.body;

    // Check if image is provided in the request
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image provided",
      });
    }

    const newMovie = new Movie({
      title,
      description,
      duration,
      price,
      seatsAvailable,
      image: req.file.path, // Assuming the image path is stored here
    });

    await newMovie.save();

    res.status(201).json({
      success: true,
      message: "Movie created successfully",
      movie: newMovie,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Book movie
const bookMovie = async (req, res) => {
  try {
    const { movieId, userId, seatsBooked, totalPrice } = req.body;

    // Check if the movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    // Check if there are enough seats available
    if (movie.seatsAvailable < seatsBooked) {
      return res.status(400).json({ success: false, message: "Not enough seats available" });
    }

    // Update the movie's seatsAvailable and add the booking
    movie.seatsAvailable -= seatsBooked;
    movie.bookings.push({
      userId,
      seatsBooked,
      totalPrice,
      paymentStatus: 'Pending',
    });

    // Save the movie with updated booking info
    await movie.save();

    res.status(200).json({
      success: true,
      message: "Movie booked successfully",
      movie,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Booking failed" });
  }
};
module.exports = {
  getMovies,
  createMovie,
  bookMovie,
};