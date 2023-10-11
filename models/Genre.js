import mongoose from "mongoose";

const genreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    movies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
    series: [{ type: mongoose.Schema.Types.ObjectId, ref: "Serie" }],
  },
  { timestamps: true }
);

const Genre = mongoose.model("Genre", genreSchema);

export default Genre;
