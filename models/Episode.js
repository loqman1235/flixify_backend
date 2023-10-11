import mongoose from "mongoose";
import slugify from "slugify";

const episodeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true },
    plot: { type: String, required: true },
    number: { type: Number, required: true },
    videoURL: { type: String },
    season: { type: mongoose.Schema.Types.ObjectId, ref: "Season" },
  },
  { timestamps: true }
);

// Middleware to automatically generate slugs before saving
episodeSchema.pre("save", function (next) {
  const specialCharactersRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/g;
  const cleanedTitle = this.title.replace(specialCharactersRegex, ""); // Remove special characters
  this.slug = slugify(cleanedTitle, { lower: true });
  next();
});

const Episode = mongoose.model("Episode", episodeSchema);

export default Episode;
