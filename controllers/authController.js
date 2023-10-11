import { body, validationResult } from "express-validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import adminValidationRules from "../validators/adminValidator.js";

const loginValidationRules = [
  body("email").notEmpty().trim().escape().withMessage("Email is required"),
  body("password")
    .notEmpty()
    .trim()
    .escape()
    .withMessage("Password is required"),
];

export const register = async (req, res) => {
  try {
    const { username, email, password, password_conf } = req.body;
    await Promise.all(adminValidationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);

    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      validationErrors.errors.push({
        value: email,
        msg: "Email is taken",
        path: "email",
        location: "body",
      });
    }

    // Checking for validation errors
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const createdAdmin = await Admin.create({
      username,
      email,
      password: hashedPassword,
    });

    const createdAdminWithoutPass = createdAdmin.toObject();
    delete createdAdminWithoutPass.password;

    res
      .status(200)
      .json({ msg: "Successfully registered", admin: createdAdminWithoutPass });
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error");
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    await Promise.all(loginValidationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (!existingAdmin) {
      return res.status(400).json({ error: "Wrong Credentials" });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      existingAdmin.password
    );

    if (!isPasswordValid) {
      return res.status(400).json({ error: "Wrong Credentials" });
    }

    const accessToken = jwt.sign(
      {
        id: existingAdmin._id,
        email: existingAdmin.email,
        username: existingAdmin.username,
      },
      process.env.JWT_SECRET
    );

    res.cookie("accessToken", accessToken, { httpOnly: true });

    res.status(200).json({ msg: "Login success" });
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error");
  }
};
