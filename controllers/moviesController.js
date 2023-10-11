import { validationResult } from "express-validator";
import { isValidObjectId } from "mongoose";
import Movie from "../models/Movie.js";
import Genre from "../models/Genre.js";
import cloudinary from "../utils/cloudinary.js";
import movieValidationRules from "../validators/movieValidator.js";

export const getAllMovies = async (req, res) => {
  try {
    const { sort, limit } = req.query;
    let sortOption = {};

    const limitValue = limit ? parseInt(limit) : undefined;

    if (sort) {
      if (sort === "newest") {
        sortOption = { releaseDate: -1 }; // Sort by releaseDate descending (newest first)
      } else if (sort === "oldest") {
        sortOption = { releaseDate: 1 }; // Sort by releaseDate ascending (oldest first)
      }
    }
    // Populate
    const movies = await Movie.find()
      .sort(sortOption)
      .limit(limitValue)
      .populate("genres", "name");
    if (movies.length === 0) {
      return res.status(404).json("No movies found");
    }
    res.status(200).json({ movies });
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};
export const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid movie ID" });
    }
    const movie = await Movie.findById({ _id: id });

    if (!movie) {
      return res.status(404).json("No movie found");
    }

    res.status(200).json({ movie });
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

export const createMovie = async (req, res, io) => {
  try {
    const { title, plot, releaseDate, runtime, country, trailer, genres } =
      req.body;

    await Promise.all(movieValidationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);

    // Check if poster is present
    if (!req.files || !req.files["poster"]) {
      validationErrors.errors.push({
        msg: "Poster is required",
        param: "poster",
        location: "body",
      });
    }

    // Check if backdrop is present
    if (!req.files || !req.files["backdrop"]) {
      validationErrors.errors.push({
        msg: "Backdrop is required",
        param: "backdrop",
        location: "body",
      });
    }

    // Check if movie exist
    const existingMovie = await Movie.findOne({ title });
    if (existingMovie) {
      validationErrors.errors.push({
        value: title,
        msg: "Movie already exists",
        param: "movie",
        location: "body",
      });
    }

    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    // Upload poster
    const posterResult = await cloudinary.uploader.upload(
      req.files["poster"][0].path,
      {
        folder: "movies/posters",
      }
    );

    // Upload backdrop
    const backdropResult = await cloudinary.uploader.upload(
      req.files["backdrop"][0].path,
      {
        folder: "movies/backdrops",
      }
    );

    const createdMovie = await Movie.create({
      title,
      plot,
      releaseDate,
      runtime,
      country,
      trailer,
      poster: {
        public_id: posterResult.public_id,
        url: posterResult.secure_url,
      },
      backdrop: {
        public_id: backdropResult.public_id,
        url: backdropResult.secure_url,
      },
      genres,
    });

    // Update the associated genres with the movie ID
    const genreUpdatePromises = genres.map(async (genreId) => {
      const genre = await Genre.findById(genreId);
      if (genre) {
        genre.movies.push(createdMovie._id);
        await genre.save();
      }
    });

    await Promise.all(genreUpdatePromises);

    io.emit("newMovie", {
      title: createdMovie.title,
      poster: createdMovie.poster.url,
    });

    res
      .status(200)
      .json({ msg: "Movie created successfully", movie: createdMovie });
  } catch (err) {
    console.error(err);
    res.status(500).json("Internal server error");
  }
};

export const updateMovieById = async (req, res) => {
  try {
    const { title, plot, releaseDate, runtime, country, trailer, genres } =
      req.body;
    const { id } = req.params;

    await Promise.all(movieValidationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);

    // Check if poster is present
    if (!req.files || !req.files["poster"]) {
      validationErrors.errors.push({
        msg: "Poster is required",
        param: "poster",
        location: "body",
      });
    }

    // Check if backdrop is present
    if (!req.files || !req.files["backdrop"]) {
      validationErrors.errors.push({
        msg: "Backdrop is required",
        param: "backdrop",
        location: "body",
      });
    }

    // Check if the user provided a new poster and delete the old one from Cloudinary
    if (req.files && req.files["poster"]) {
      const existingMovie = await Movie.findById(id);
      if (existingMovie.poster.public_id) {
        await cloudinary.uploader.destroy(existingMovie.poster.public_id);
      }
    }

    // Check if the user provided a new backdrop and delete the old one from Cloudinary
    if (req.files && req.files["backdrop"]) {
      const existingMovie = await Movie.findById(id);
      if (existingMovie.backdrop.public_id) {
        await cloudinary.uploader.destroy(existingMovie.backdrop.public_id);
      }
    }

    // Upload new poster
    const posterResult = await cloudinary.uploader.upload(
      req.files["poster"][0].path,
      {
        folder: "movies/posters",
      }
    );

    // Upload new backdrop
    const backdropResult = await cloudinary.uploader.upload(
      req.files["backdrop"][0].path,
      {
        folder: "movies/backdrops",
      }
    );
    const updatedMovie = await Movie.findByIdAndUpdate(
      id,
      {
        title,
        plot,
        releaseDate,
        runtime,
        country,
        trailer,
        poster: {
          public_id: posterResult.public_id,
          url: posterResult.secure_url,
        },
        backdrop: {
          public_id: backdropResult.public_id,
          url: backdropResult.secure_url,
        },
        genres,
      },
      { new: true } // Return the updated document
    );

    // Update the associated genres with the movie ID
    const genreUpdatePromises = genres.map(async (genreId) => {
      const genre = await Genre.findById(genreId);
      if (genre) {
        genre.movies.push(updatedMovie._id);
        await genre.save();
      }
    });
    await Promise.all(genreUpdatePromises);

    res
      .status(200)
      .json({ msg: "Movie updated successfully", movie: updatedMovie });
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

export const deleteMovieById = async (req, res) => {
  try {
    const { id } = req.params;
    const existingMovie = await Movie.findById(id);

    if (!existingMovie) {
      return res.status(404).json("Movie not found");
    }

    if (existingMovie.poster.public_id) {
      await cloudinary.uploader.destroy(existingMovie.poster.public_id);
    }

    if (existingMovie.backdrop.public_id) {
      await cloudinary.uploader.destroy(existingMovie.backdrop.public_id);
    }

    await Movie.findByIdAndDelete(id);
    res.status(200).json("Movie removed successfully");
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

// Managing likes/dislikes

export const addMovieLike = async (req, res) => {
  try {
    const { id: movieId } = req.params;
    const { userId } = req.user;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    // Check if the user has already liked/disliked the movie.
    const userLikedIndex = movie.likes.indexOf(userId);
    const userDislikedIndex = movie.dislikes.indexOf(userId);

    if (userLikedIndex === -1) {
      movie.likes.push(userId);

      if (userDislikedIndex !== -1) {
        movie.dislikes.splice(userDislikedIndex, 1);
      }
    } else {
      // Remove the like if the user has already liked the movie
      movie.likes.splice(userLikedIndex, 1);
    }

    await movie.save();

    res.status(200).json(movie);
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error");
  }
};

export const addMovieDislike = async (req, res) => {
  try {
    const { id: movieId } = req.params;
    const { userId } = req.user;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    // Check if the user has already liked/disliked the movie.
    const userDislikedIndex = movie.dislikes.indexOf(userId);
    const userLikedIndex = movie.likes.indexOf(userId);

    if (userDislikedIndex === -1) {
      movie.dislikes.push(userId);

      if (userLikedIndex !== -1) {
        movie.likes.splice(userLikedIndex, 1);
      }
    } else {
      // Remove the dislike if the user has already disliked the movie
      movie.dislikes.splice(userDislikedIndex, 1);
    }

    await movie.save();

    res.status(200).json(movie);
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error");
  }
};
