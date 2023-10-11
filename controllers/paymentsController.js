import Stripe from "stripe";
import Plan from "../models/Plan.js";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  try {
    const { planId, userId } = req.body;
    const plan = await Plan.findById(planId);

    if (!plan) {
      return res.stauts(404).json("Plan not found");
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.stripePlanId,
          quantity: 1,
        },
      ],
      success_url: process.env.CLIENT_URL + "/sign-in",
      cancel_url: process.env.CLIENT_URL + "/",
      client_reference_id: userId,
    });
    // Return the session url
    res.status(200).json({ success: true, sessionUrl: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
};

export const handleWebhook = async (req, res) => {
  const header = req.headers["stripe-signature"];
  const payload = req.body;
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      header,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const subscriptionId = session.subscription;

      // Get subscription details
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      console.log(subscription);
      const stripePlanId = subscription.items.data[0].plan.id;
      const plan = await Plan.findOne({ stripePlanId: stripePlanId });
      const userId = session.client_reference_id;

      console.log(plan);

      const user = await User.findById(userId);
      if (!user) {
        console.log("User not found");
        return res.sendStatus(400);
      }

      user.isSubscribed = true;
      await user.save();

      //Update database subscription detail
      const newSubscription = await Subscription.create({
        userId,
        planId: plan._id,
        stripeSubscriptionId: subscriptionId,
        stripeSubscriptionItemId: subscription.items.data[0].id,
        status: "active",
        startDate: new Date(subscription.current_period_start * 1000),
        endDate: new Date(subscription.current_period_end * 1000),
      });

      console.log("Subscription created:", newSubscription);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send("Error");
  }

  res.sendStatus(200);
};

// Update subscription
export const updateSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPlanId } = req.body;
    // Get user and his current active subscription

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json("User not found");
    }

    // Get the user's current subscription
    const subscription = await Subscription.findOne({ userId: userId });
    if (!subscription) {
      return res.status(400).json("User does not have an active subscription");
    }

    // Get the new plan details
    const newPlan = await Plan.findById(newPlanId);

    if (!newPlan) {
      return res.status(404).json("New plan not found");
    }

    // Update the subscription plan with the new plan
    await stripe.subscriptionItems.update(
      subscription.stripeSubscriptionItemId,
      {
        price: newPlan.stripePlanId,
      }
    );

    // Update the subscription details in the database
    user.isSubscribed = true;
    await user.save();
    subscription.planId = newPlan._id;
    subscription.status = "active";
    await subscription.save();

    res
      .status(200)
      .json({ success: true, message: "Subscription updated successfully" });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ error: "Failed to update subscription" });
  }
};

// Cancel subscrption
export const cancelSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json("User not found");
    }

    // Check if the user has an active subscription
    if (!user.isSubscribed) {
      return res.status(400).json("User does not have an active subscription");
    }

    // Retrieve the subscription object from the database
    const subscription = await Subscription.findOne({
      userId: user._id,
    });

    if (!subscription) {
      return res.status(404).json("Subscription not found");
    }

    // Cancel the subscription on the Stripe platform
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update the subscription status in the database
    subscription.status = "canceled";
    await subscription.save();

    // Set the "isSubscribed" field to false for the user
    user.isSubscribed = false;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Subscription canceled successfully" });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return res.status(500).json({ error: "Failed to cancel subscription" });
  }
};

export const getSubscriptionByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const subscription = await Subscription.findOne({
      userId: userId,
    }).populate("planId");

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    // Fetch the plan details using the planId
    const plan = await Plan.findById(subscription.planId);

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // subscription.planName = plan.name;
    // subscription.planPrice = plan.price;

    res.status(200).json({ subscription });
  } catch (error) {
    console.error("Error getting subscription:", error);
    return res.status(500).json({ error: "Failed to get subscription" });
  }
};
