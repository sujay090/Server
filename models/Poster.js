import mongoose from 'mongoose';

const placeholderSchema = new mongoose.Schema({
  text: String,
  x: Number,
  y: Number,
  style: {
    fontFamily: String,
    fontSize: String,
    color: String,
    fontWeight: String,
    fontStyle:String
  },
});

const posterSchema = new mongoose.Schema({
  category: { type: String, required: true },
  originalImagePath: { type: String, required: true },
  finalImagePath: { type: String },
  placeholders: [placeholderSchema],
}, { timestamps: true });

export default mongoose.model('Poster', posterSchema);
