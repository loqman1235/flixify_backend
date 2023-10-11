import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  avatar: { type: String },
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  isSubscribed: { type: Boolean, default: false },
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
});

const User = mongoose.model("User", userSchema);

export default User;
