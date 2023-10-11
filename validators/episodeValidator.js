import { body } from "express-validator";

const episodeValidationRules = [
  body("title").notEmpty().trim().escape().withMessage("Title is required"),
  body("plot").notEmpty().trim().escape().withMessage("Plot is required"),
  body("number")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Episode number is required"),
  body("videoURL")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Episode video URL is required"),
];

export default episodeValidationRules;
