import Serie from "../models/Serie.js";
import serieValidationRules from "../validators/serieValidator.js";
import seasonValidationRules from "../validators/seasonValidator.js";
import episodeValidationRules from "../validators/episodeValidator.js";
import { validationResult } from "express-validator";
import cloudinary from "../utils/cloudinary.js";
import Genre from "../models/Genre.js";
import Season from "../models/Season.js";
import Episode from "../models/Episode.js";

// Get all series
export const getAllSeries = async (req, res) => {
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

    const series = await Serie.find()
      .sort(sortOption)
      .limit(limitValue)
      .populate("seasons")
      .populate({ path: "genres", model: "Genre", select: "-movies -series" });
    if (series.length === 0) {
      return res.status(404).json("No series found");
    }

    res.status(200).json({ series });
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error");
  }
};

// Get a serie by slug
export const getSerieBySlug = async (req, res) => {
  try {
    const { serieSlug } = req.params;
    // if (!isValidObjectId(id)) {
    //   return res.status(400).json("Invalid serie ID");
    // }
    const serie = await Serie.findOne({ slug: serieSlug })
      .populate("seasons")
      .populate({ path: "genres", model: "Genre", select: "-movies -series" });
    if (!serie) {
      return res.status(404).json("No serie found");
    }
    res.status(200).json({ serie });
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error");
  }
};

// Create a serie
export const createSerie = async (req, res) => {
  try {
    const { title, plot, releaseDate, country, trailer, genres, seasons } =
      req.body;

    await Promise.all(serieValidationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);

    // Check if poster is present
    if (!req.files || !req.files["poster"]) {
      validationErrors.errors.push({
        msg: "Poster is required",
        param: "poster",
        location: "body",
      });
    }
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    const poster = req.files["poster"][0];
    const posterResult = await cloudinary.uploader.upload(poster.path);

    let backdropResult;
    if (req.files && req.files["backdrop"]) {
      backdropResult = await cloudinary.uploader.upload(
        req.files["backdrop"][0].path
      );
    }

    const createdSerie = await Serie.create({
      title,
      plot,
      releaseDate,
      country,
      trailer,
      poster: {
        public_id: posterResult.public_id,
        url: posterResult.secure_url,
      },
      backdrop: {
        public_id: backdropResult ? backdropResult.public_id : "N/A",
        url: backdropResult ? backdropResult.secure_url : "N/A",
      },
      genres,
      // seasons,
    });

    // Add serie to specifc genres
    const genreUpdatePromises = genres.map(async (genreID) => {
      const genre = await Genre.findById(genreID);
      if (genre) {
        genre.series.push(createdSerie._id);
        await genre.save();
      }
    });

    await Promise.all(genreUpdatePromises);

    res
      .status(200)
      .json({ msg: "Serie created successfully", serie: createdSerie });
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error");
  }
};

// Update a serie by slug
export const updateSerieBySlug = async (req, res) => {
  try {
    const { serieSlug } = req.params;
    const { title, plot, releaseDate, country, trailer, genres } = req.body;

    await Promise.all(serieValidationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);
    // Check if poster is present
    if (!req.files || !req.files["poster"]) {
      validationErrors.errors.push({
        msg: "Poster is required",
        param: "poster",
        location: "body",
      });
    }

    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    const existingSerie = await Serie.findOne({ slug: serieSlug });
    if (!existingSerie) {
      return res.status(404).json({ error: "Serie not found" });
    }
    // Check if the user provided a new poster and delete the old one from Cloudinary
    if (req.files && req.files["poster"]) {
      if (existingSerie.poster && existingSerie.poster.public_id) {
        await cloudinary.uploader.destroy(existingSerie.poster.public_id);
      }
    }

    // Check if the user provided a new backdrop and delete the old one from Cloudinary
    if (req.files && req.files["backdrop"]) {
      if (existingSerie.backdrop && existingSerie.backdrop.public_id) {
        await cloudinary.uploader.destroy(existingSerie.backdrop.public_id);
      }
    }

    // Uploading the poster to cloudinary
    const poster = req.files["poster"][0];
    const posterResult = await cloudinary.uploader.upload(poster.path);

    // Uploading the backdrop to cloudinary
    let backdropResult;
    if (req.files && req.files["backdrop"]) {
      backdropResult = await cloudinary.uploader.upload(
        req.files["backdrop"][0].path
      );
    }

    // Update the existing serie with the new data
    existingSerie.title = title;
    existingSerie.plot = plot;
    existingSerie.releaseDate = releaseDate;
    existingSerie.country = country;
    existingSerie.trailer = trailer;
    existingSerie.poster = {
      public_id: posterResult.public_id,
      url: posterResult.secure_url,
    };
    if (backdropResult) {
      existingSerie.backdrop = {
        public_id: backdropResult.public_id,
        url: backdropResult.secure_url,
      };
    }
    existingSerie.genres = genres;
    const updatedSerie = await existingSerie.save();

    // Update the associated genres with the movie ID
    const genreUpdatePromises = genres.map(async (genreId) => {
      const genre = await Genre.findById(genreId);
      if (genre) {
        genre.series.push(updatedSerie._id);
        await genre.save();
      }
    });
    await Promise.all(genreUpdatePromises);

    res.status(200).json({ msg: "Update", updated: updatedSerie });
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

// Remove a serie by slug
export const removeSerieBySlug = async (req, res) => {
  try {
    const { serieSlug } = req.params;

    // Check if the serie exists
    const existingSerie = await Serie.findOne({ slug: serieSlug });

    console.log(serieSlug);

    if (!existingSerie) {
      return res.status(404).json("Serie not found");
    }

    if (existingSerie.poster.public_id) {
      await cloudinary.uploader.destroy(existingSerie.poster.public_id);
    }

    if (existingSerie.backdrop.public_id) {
      await cloudinary.uploader.destroy(existingSerie.backdrop.public_id);
    }

    await Serie.findOneAndDelete({ slug: serieSlug });

    res.status(200).json("Serie removed successfully");
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

// Create Season
export const createSeason = async (req, res) => {
  try {
    const { serieSlug } = req.params;
    const { title, number, releaseDate } = req.body;
    if (!serieSlug) {
      return res.status(400).json({ error: "Serie slug is required" });
    }

    const serie = await Serie.findOne({ slug: serieSlug });

    if (!serie) {
      return res.status(404).json({ error: "Serie not found" });
    }

    await Promise.all(seasonValidationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    const createdSeason = await Season.create({
      title,
      number,
      releaseDate,
      serie: serie._id,
    });

    serie.seasons.push(createdSeason);
    await serie.save();

    res
      .status(200)
      .json({ msg: "Season created successfully", season: createdSeason });
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error");
  }
};

// Get Seasons by serie slug
export const getSeasonsBySerieSlug = async (req, res) => {
  try {
    const { serieSlug } = req.params;
    const serie = await Serie.findOne({ slug: serieSlug });

    if (!serie) {
      return res.status(404).json("No serie found");
    }

    const seasons = await Season.find({ serie: serie._id }).populate(
      "episodes"
    );

    if (seasons.length === 0) {
      return res.status(404).json("No seasons found");
    }

    res.status(200).json({ seasons });
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error");
  }
};

// Get a specifc season by serie slug
export const getSeasonBySerieSlug = async (req, res) => {
  try {
    const { serieSlug, seasonSlug } = req.params;

    const serie = await Serie.findOne({ slug: serieSlug });

    if (!serie) {
      return res.status(404).json("No serie found");
    }

    const season = await Season.findOne({
      slug: seasonSlug,
      serie: serie._id,
    }).populate("episodes");

    if (!season) {
      return res.status(404).json("No seasons found");
    }

    res.status(200).json({ season });
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error");
  }
};

// Update Season
export const updateSeasonBySlugs = async (req, res) => {
  try {
    const { serieSlug, seasonSlug } = req.params;
    const { title, number, releaseDate } = req.body;
    const existingSerie = await Serie.findOne({ slug: serieSlug });
    if (!serieSlug) {
      return res.status(400).json({ error: "Serie slug is required" });
    }

    if (!seasonSlug) {
      return res.status(400).json({ error: "Season slug is required" });
    }
    if (!existingSerie) {
      return res.status(404).json("Serie not found");
    }

    await Promise.all(seasonValidationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    const updatedSeason = await Season.findOneAndUpdate(
      { slug: seasonSlug },
      {
        title,
        number,
        releaseDate,
        serie: existingSerie._id,
      },
      { new: true }
    );
    existingSerie.seasons.push(updatedSeason);
    res
      .status(200)
      .json({ msg: "Season updated successfully", season: updatedSeason });
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error");
  }
};

// Delete Season
export const removeSeasonBySlugs = async (req, res) => {
  try {
    const { serieSlug, seasonSlug } = req.params;

    if (!serieSlug) {
      return res.status(400).json({ error: "Serie slug is required" });
    }

    if (!seasonSlug) {
      return res.status(400).json({ error: "Season slug is required" });
    }

    const existingSerie = await Serie.findOne({ slug: serieSlug });
    if (!existingSerie) {
      return res.status(400).json({ error: "Serie not found" });
    }

    await Season.findOneAndDelete({ slug: seasonSlug });
    res.status(200).json("Season removed successfully");
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error");
  }
};

// EPISODES

// Create episode
export const createEpisode = async (req, res) => {
  try {
    const { serieSlug, seasonSlug } = req.params;
    const { title, plot, number, videoURL } = req.body;
    if (!serieSlug) {
      return res.status(400).json({ error: "Serie slug is required" });
    }
    if (!seasonSlug) {
      return res.status(400).json({ error: "Season slug is required" });
    }

    const existingSerie = await Serie.findOne({ slug: serieSlug });
    const existingSeason = await Season.findOne({ slug: seasonSlug });

    if (!existingSerie) {
      return res.status(400).json({ error: "Serie not found" });
    }

    if (!existingSeason) {
      return res.status(400).json({ error: "Season not found" });
    }

    await Promise.all(episodeValidationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    const createdEpisode = await Episode.create({
      title,
      plot,
      number,
      videoURL,
      season: existingSeason._id,
    });

    existingSeason.episodes.push(createdEpisode);
    await existingSeason.save();

    res
      .status(200)
      .json({ msg: "Episode created successfully", episode: createdEpisode });
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error");
  }
};

// Get episodes
export const getEpisodesBySlugs = async (req, res) => {
  try {
    const { serieSlug, seasonSlug } = req.params;
    if (!serieSlug) {
      return res.status(400).json({ error: "Serie slug is required" });
    }
    if (!seasonSlug) {
      return res.status(400).json({ error: "Season slug is required" });
    }

    const existingSerie = await Serie.findOne({ slug: serieSlug });
    const existingSeason = await Season.findOne({
      serie: existingSerie._id,
      slug: seasonSlug,
    });

    if (!existingSerie) {
      return res.status(400).json({ error: "Serie not found" });
    }

    if (!existingSeason) {
      return res.status(400).json({ error: "Season not found" });
    }

    const episodes = await Episode.find({ season: existingSeason._id });

    if (episodes.length === 0) {
      return res.status(404).json("No episodes found");
    }

    res.status(200).json({ episodes });
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error");
  }
};

// Get episode
export const getEpisodeBySlug = async (req, res) => {
  try {
    const { serieSlug, seasonSlug, episodeSlug } = req.params;
    if (!serieSlug) {
      return res.status(400).json({ error: "Serie slug is required" });
    }
    if (!seasonSlug) {
      return res.status(400).json({ error: "Season slug is required" });
    }

    if (!episodeSlug) {
      return res.status(400).json({ error: "Episode slug is required" });
    }

    const existingSerie = await Serie.findOne({ slug: serieSlug });
    const existingSeason = await Season.findOne({
      serie: existingSerie._id,
      slug: seasonSlug,
    });
    const existingEpisode = await Episode.findOne({
      season: existingSeason._id,
      slug: episodeSlug,
    });

    if (!existingSerie) {
      return res.status(400).json({ error: "Serie not found" });
    }

    if (!existingSeason) {
      return res.status(400).json({ error: "Season not found" });
    }

    if (!existingEpisode) {
      return res.status(400).json({ error: "Episode not found" });
    }

    res.status(200).json({ episode: existingEpisode });
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error");
  }
};

// Update episode
export const updateEpisodeBySlug = async (req, res) => {
  try {
    const { serieSlug, seasonSlug, episodeSlug } = req.params;
    const { title, plot, number, videoURL } = req.body;
    if (!serieSlug) {
      return res.status(400).json({ error: "Serie slug is required" });
    }
    if (!seasonSlug) {
      return res.status(400).json({ error: "Season slug is required" });
    }
    if (!episodeSlug) {
      return res.status(400).json({ error: "Episode slug is required" });
    }

    const existingSerie = await Serie.findOne({ slug: serieSlug });
    const existingSeason = await Season.findOne({ slug: seasonSlug });
    const existingEpisode = await Episode.findOne({ slug: episodeSlug });

    if (!existingSerie) {
      return res.status(400).json({ error: "Serie not found" });
    }

    if (!existingSeason) {
      return res.status(400).json({ error: "Season not found" });
    }

    if (!existingEpisode) {
      return res.status(400).json({ error: "Episode not found" });
    }

    await Promise.all(episodeValidationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    const updatedEpisode = await Episode.findOneAndUpdate(
      { slug: episodeSlug },
      {
        title,
        plot,
        number,
        videoURL,
      },
      { new: true }
    );
    existingSeason.episodes.push(updatedEpisode);
    await existingSeason.save();

    res
      .status(200)
      .json({ msg: "Episode updated successfully", episode: updatedEpisode });
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error");
  }
};

// Remove Episode
export const removeEpisodeBySlug = async (req, res) => {
  try {
    const { serieSlug, seasonSlug, episodeSlug } = req.params;
    if (!serieSlug) {
      return res.status(400).json({ error: "Serie slug is required" });
    }
    if (!seasonSlug) {
      return res.status(400).json({ error: "Season slug is required" });
    }
    if (!episodeSlug) {
      return res.status(400).json({ error: "Episode slug is required" });
    }

    const existingSerie = await Serie.findOne({ slug: serieSlug });
    const existingSeason = await Season.findOne({ slug: seasonSlug });
    const existingEpisode = await Episode.findOne({ slug: episodeSlug });

    if (!existingSerie) {
      return res.status(400).json({ error: "Serie not found" });
    }

    if (!existingSeason) {
      return res.status(400).json({ error: "Season not found" });
    }

    if (!existingEpisode) {
      return res.status(400).json({ error: "Episode not found" });
    }
    await Episode.findOneAndDelete({ slug: episodeSlug });

    res
      .status(200)
      .json({ msg: "Episode removed successfully", episode: existingEpisode });
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error");
  }
};

export const addSerieLike = async (req, res) => {
  try {
    const { serieSlug } = req.params;
    const { userId } = req.user;

    const serie = await Serie.findOne({ slug: serieSlug });

    if (!serie) {
      return res.status(404).json({ message: "Serie not found" });
    }

    // Check if the user has already liked/disliked the serie.
    const userLikedIndex = serie.likes.indexOf(userId);
    const userDislikedIndex = serie.dislikes.indexOf(userId);

    if (userLikedIndex === -1) {
      serie.likes.push(userId);

      if (userDislikedIndex !== -1) {
        serie.dislikes.splice(userDislikedIndex, 1);
      }
    } else {
      // Remove the like if the user has already liked the serie
      serie.likes.splice(userLikedIndex, 1);
    }

    await serie.save();

    res.status(200).json(serie);
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error");
  }
};

export const addSerieDislike = async (req, res) => {
  try {
    const { serieSlug } = req.params;
    const { userId } = req.user;
    const serie = await Serie.findOne({ slug: serieSlug });

    if (!serie) {
      return res.status(404).json({ message: "Serie not found" });
    }

    // Check if the user has already liked/disliked the movie.
    const userDislikedIndex = serie.dislikes.indexOf(userId);
    const userLikedIndex = serie.likes.indexOf(userId);

    if (userDislikedIndex === -1) {
      serie.dislikes.push(userId);

      if (userLikedIndex !== -1) {
        serie.likes.splice(userLikedIndex, 1);
      }
    } else {
      // Remove the dislike if the user has already disliked the serie
      serie.dislikes.splice(userDislikedIndex, 1);
    }

    await serie.save();

    res.status(200).json(serie);
  } catch (error) {}
};
