import mongoose from "mongoose";

const planSchame = new mongoose.Schema({
  stripePlanId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: String, required: true },
  interval: { type: String, required: true },
});

const Plan = mongoose.model("Plan", planSchame);

export default Plan;
