import Stripe from "stripe";
import Plan from "../models/Plan.js";
import { validationResult } from "express-validator";
import planValidationRules from "../validators/planValidator.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPlan = async (req, res) => {
  try {
    const { name, price, interval } = req.body;

    await Promise.all(planValidationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    const stripePlan = await stripe.plans.create({
      nickname: name,
      amount: price * 100,
      currency: "usd",
      interval: interval,
      product: {
        name: name,
        type: "service",
      },
    });

    const createdPlan = await Plan.create({
      name,
      price,
      interval,
      stripePlanId: stripePlan.id,
    });


    console.log(stripePlan, 'CREATED PLAN')
    res
      .status(200)
      .json({ msg: "Plan created successfully", plan: createdPlan });
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error");
  }
};

export const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find();
    if (plans.length === 0) {
      return res.status(404).json("No plans found");
    }
    res.status(200).json({ plans });
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error");
  }
};

export const removePlan = async (req, res) => {
  try {
    const { plandId } = req.params;
    const plan = await Plan.findById(plandId);
    if (!plan) {
      return res.status(404).json("Plan not found");
    }

    // Remove the plan from stripe
    await stripe.plans.del(plan.stripePlanId);
    await Plan.findByIdAndDelete(plandId);

    res.status(200).json("Plan removed successfully");
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error");
  }
};
