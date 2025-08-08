// models/Schedule.js
import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  posterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poster',
  },
  generatedPosterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GeneratedPoster',
  },
  category: {
    type: String,
    required: true,
  },
  // Store date and time as strings to avoid timezone parsing issues
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  time: {
    type: String, // HH:mm (24h format)
    required: true,
  },
  status:{
    type:String,
    enum:["Pending","Sent","Failed"],
    default:"Pending"
  }
});

export default mongoose.model('Schedule', scheduleSchema);
