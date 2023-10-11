import mongoose from "mongoose";
import slugify from "slugify";

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true },
    plot: { type: String, required: true },
    releaseDate: { type: Date },
    runtime: { type: Number, required: true },
    country: { type: String, required: true },
    poster: {
      public_id: { type: String, required: true },
      url: { type: String, required: true },
    },
    backdrop: {
      public_id: { type: String, required: true },
      url: { type: String, required: true },
    },
    trailer: { type: String },
    genres: [{ type: mongoose.Schema.Types.ObjectId, ref: "Genre" }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// Middleware to automatically generate slugs before saving
movieSchema.pre("save", function (next) {
  const specialCharactersRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/g;
  const cleanedTitle = this.title.replace(specialCharactersRegex, ""); // Remove special characters
  this.slug = slugify(cleanedTitle, { lower: true });
  next();
});

const Movie = mongoose.model("Movie", movieSchema);

export default Movie;
