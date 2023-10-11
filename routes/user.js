import express from "express";
import verifyUserToken from "../middlewares/verifyUserToken.js";
import { login, logout, register } from "../controllers/userAuthController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
// Verify Token for logout (assume someone sending a logout link to a user that would be a potential danger)
router.post("/logout", verifyUserToken, logout);
export default router;
