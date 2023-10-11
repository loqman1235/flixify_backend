import { body } from "express-validator";

const collectionValidationRules = [
  body("name")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Collection name is required"),
  body("contentItems")
    .isArray({ min: 1 })
    .withMessage("At least one movie/serie is required"),
];

export default collectionValidationRules;
