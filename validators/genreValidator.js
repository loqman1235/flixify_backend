import { body } from "express-validator";

const genreValidationRules = [
  body("name").notEmpty().trim().escape().withMessage("Genre name is required"),
];

export default genreValidationRules;
