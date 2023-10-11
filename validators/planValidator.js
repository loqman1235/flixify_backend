import { body } from "express-validator";

const planValidationRules = [
  body("name")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Subscription plan name is required"),
  body("price")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Subscription plan price is required"),
  body("interval")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Subscription plan interval is required"),
];

export default planValidationRules;
