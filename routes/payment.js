import express from "express";
import {
  createCheckoutSession,
  handleWebhook,
} from "../controllers/paymentsController.js";

const router = express.Router();

router.post("/create-checkout-session", createCheckoutSession);
router.post("/webhook", handleWebhook);

export default router;
