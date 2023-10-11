import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    items: [
      {
        contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
        contentType: { type: String, enum: ["Movie", "Serie"], required: true },
      },
    ],
  },
  { timestamps: true }
);

const Collection = mongoose.model("Collection", collectionSchema);

export default Collection;
