import express from "express";
import {
  cancelSubscription,
  getSubscriptionByUserId,
  updateSubscription,
} from "../controllers/paymentsController.js";

const router = express.Router();

router.post("/update-subscription/:userId", updateSubscription);
router.post("/cancel-subscription/:userId", cancelSubscription);
router.get("/:userId", getSubscriptionByUserId);
export default router;
