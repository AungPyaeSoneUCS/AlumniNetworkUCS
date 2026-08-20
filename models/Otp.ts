// file: models/Otp.ts

import { Schema, model, models } from "mongoose";

const OtpSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // Register only
    name: {
      type: String,
      trim: true,
      default: "",
    },

    fatherName: {
      type: String,
      trim: true,
      default: "",
    },

    graduatedYear: {
      type: String, // <-- Updated from Number to String
      default: "",  // <-- Updated from null to empty string
    },

    // Register only
    password: {
      type: String,
      default: "",
    },

    otp: {
      type: String,
      required: true,
      trim: true,
    },

    purpose: {
      type: String,
      // UPGRADED: Added "staff-forgot-password" to allow staff recovery
      enum: ["register", "forgot-password", "admin-forgot-password", "staff-forgot-password"],
      required: true,
    },

    lang: {
      type: String,
      enum: ["en", "mm"],
      default: "en",
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  },
);

export default models.Otp || model("Otp", OtpSchema);