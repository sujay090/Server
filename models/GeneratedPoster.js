import mongoose from "mongoose";

const generatedPosterSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    category: String,
    originalPosterId: { type: mongoose.Schema.Types.ObjectId, ref: "Poster" },
    generatedImagePath: String,
  },
  { timestamps: true }
);

export default mongoose.model("GeneratedPoster", generatedPosterSchema);
