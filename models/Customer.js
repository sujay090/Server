import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    logoUrl: {
      type: String,
      default: "",
    },
    website: {
      type: String,
      default: "",
    },
    whatsapp: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^[0-9]{10,15}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid WhatsApp number!`,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Customer", customerSchema);
