import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import userValidationRules from "../validators/userValidator.js";
import { body } from "express-validator";
import randProfilePicture from "../helpers/profilePicGenerator.js";

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
    const { username, email, password } = req.body;

    await Promise.all(userValidationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Avatar
    const avatar = randProfilePicture(username);

    const createdUser = await User.create({
      username,
      email,
      password: hashedPassword,
      avatar,
    });

    const createdUserWithoutPass = createdUser.toObject();
    delete createdUserWithoutPass.password;
    res.status(201).json({
      msg: "User successfully registred",
      user: createdUserWithoutPass,
    });
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

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(400).json({ error: "Wrong Credentials" });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordValid) {
      return res.status(400).json({ error: "Wrong Credentials" });
    }

    const accessToken = jwt.sign(
      {
        userId: existingUser._id,
        email: existingUser.email,
        username: existingUser.username,
        isSubscribed: existingUser.isSubscribed,
      },
      process.env.JWT_SECRET
    );

    const existingUserWithoutPassword = existingUser.toObject();
    delete existingUserWithoutPassword.password;
    res.cookie("accessToken", accessToken, { httpOnly: true });

    res
      .status(200)
      .json({ msg: "Login success", user: existingUserWithoutPassword });
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Erorr");
  }
};
// Logout
export const logout = async (req, res) => {
  // Clear the cookie
  res.clearCookie("accessToken");
  res.status(200).json({ message: "User successfully logged out" });
};
