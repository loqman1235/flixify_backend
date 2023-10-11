import mongoose from "mongoose";
import slugify from "slugify";

const serieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true },
    plot: { type: String, required: true },
    releaseDate: { type: Date, required: true },
    country: { type: String, required: true },
    poster: {
      public_id: { type: String, required: true },
      url: { type: String, required: true },
    },
    backdrop: {
      public_id: { type: String, required: true },
      url: { type: String, required: true },
    },
    genres: [{ type: mongoose.Schema.Types.ObjectId, ref: "Genre" }],
    seasons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Season" }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// Middleware to automatically generate slugs before saving
serieSchema.pre("save", function (next) {
  const specialCharactersRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/g;
  const cleanedTitle = this.title.replace(specialCharactersRegex, ""); // Remove special characters
  this.slug = slugify(cleanedTitle, { lower: true });
  next();
});

const Serie = mongoose.model("Serie", serieSchema);

export default Serie;
