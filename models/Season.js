import mongoose from "mongoose";
import slugify from "slugify";

const seasonSchema = new mongoose.Schema(
  {
    title: { type: String },
    slug: { type: String, unique: true },
    number: { type: Number, required: true },
    releaseDate: { type: Date, require: true },
    serie: { type: mongoose.Schema.Types.ObjectId, ref: "Serie" },
    episodes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Episode" }],
  },
  { timestamps: true }
);

// Middleware to automatically generate slugs before saving
seasonSchema.pre("save", function (next) {
  this.slug = slugify(`season-${this.number}`, { lower: true });
  next();
});
const Season = mongoose.model("Season", seasonSchema);

export default Season;
