import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
  stripeSubscriptionId: { type: String, required: true },
  stripeSubscriptionItemId: { type: String },
  status: {
    type: String,
    enum: ["active", "canceled", "incomplete"],
    default: "active",
  },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
