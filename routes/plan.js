import express from "express";
import {
  createPlan,
  getAllPlans,
  removePlan,
} from "../controllers/plansController.js";

const router = express.Router();

router.post("/", createPlan);
router.get("/", getAllPlans);
router.delete("/:planId", removePlan);

export default router;
