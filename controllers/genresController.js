import { isValidObjectId } from "mongoose";
import Genre from "../models/Genre.js";
import { validationResult } from "express-validator";
import genreValidationRules from "../validators/genreValidator.js";

export const getAllGenres = async (req, res) => {
  try {
    const genres = await Genre.find().populate("movies").populate("series");

    if (genres.length === 0) {
      return res.status(404).json("No genres found");
    }
    res.status(200).json({ genres });
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

export const getGenreById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid genre ID" });
    }
    const genre = await Genre.findById(id).populate("movies");
    if (!genre) {
      return res.status(404).json("Genre not found");
    }
    res.status(200).json({ genre });
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

export const createGenre = async (req, res) => {
  try {
    const { name } = req.body;
    await Promise.all(genreValidationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);

    // Check if genre already exist
    const existingGenre = await Genre.findOne({ name });

    if (existingGenre) {
      validationErrors.errors.push({
        value: name,
        msg: "Genre already exists",
        param: "genre",
        location: "body",
      });
    }

    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    const createdGenre = await Genre.create({ name });

    res
      .status(201)
      .json({ msg: "Genre successfully created", genre: createdGenre });
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

export const updateGenre = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    await Promise.all(genreValidationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);
    // Check if genre exists
    const existingGenre = await Genre.findById(id);

    if (!existingGenre) {
      validationErrors.errors.push({
        value: name,
        msg: "Genre already exists",
        param: "genre",
        location: "body",
      });
    }

    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    const updatedGenre = await Genre.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );

    res
      .status(200)
      .json({ msg: "Genre successfully updated", genre: updatedGenre });
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

export const deleteGenre = async (req, res) => {
  try {
    const { id } = req.params;
    const existingGenre = await Genre.findById(id);
    if (!existingGenre) {
      return res.status(404).json("Genre not found");
    }
    await Genre.findByIdAndDelete(id);
    res
      .status(200)
      .json({ msg: "Genre successfully removed", genre: existingGenre });
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};
