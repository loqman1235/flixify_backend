import { body } from "express-validator";

const seasonValidationRules = [
  body("title").notEmpty().trim().escape().withMessage("Title is required"),
  body("number").notEmpty().trim().escape().withMessage("Number is required"),
  body("releaseDate")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Release date is required"),
];

export default seasonValidationRules;
