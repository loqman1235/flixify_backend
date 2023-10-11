import { body } from "express-validator";

const movieValidationRules = [
  body("title").notEmpty().trim().escape().withMessage("Title is required"),
  body("plot").notEmpty().trim().escape().withMessage("Plot is required"),
  body("releaseDate")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Release date is required"),
  body("runtime").notEmpty().trim().escape().withMessage("Runtime is required"),
  body("country").notEmpty().trim().escape().withMessage("Country is required"),
  body("genres")
    .isArray({ min: 1 })
    .withMessage("At least one genre is required"),
  body("trailer")
    .optional({ nullable: true })
    .trim()
    .escape()
    .isURL()
    .withMessage("Invalid trailer URL"),
];

export default movieValidationRules;
