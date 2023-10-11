import { body } from "express-validator";

const adminValidationRules = [
  body("username")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Username is required"),
  body("email")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email is not valid"),
  body("password")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Password is required"),
  body("password_conf")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Password confirmation is required")
    .custom((val, { req }) => {
      if (val !== req.body.password) {
        throw new Error("Passwords don't match");
      }
      return true;
    }),
];

export default adminValidationRules;
