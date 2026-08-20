// file: models/ApprovedStudent.ts

import mongoose from "mongoose";

const ApprovedStudentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    fatherName: {
      type: String,
      required: true,
      trim: true,
    },

    graduatedYear: {
      type: String, // <-- Changed from Number to String
      required: true,
      trim: true,   // <-- Added trim for cleaner strings
      // Note: Numeric min/max validation was removed to allow strings like "2027 (Junior)"
    },

    // Indicates the admin has approved/imported this data (eligible to register)
    approved: {
      type: Boolean,
      default: true,
    },

    // NEW: Tracks if the alumni actually went to /register and created an account
    registered: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient sorting/filtering by year
ApprovedStudentSchema.index({ graduatedYear: -1 });

if (mongoose.models.ApprovedStudent) {
  delete mongoose.models.ApprovedStudent;
}

export default mongoose.model("ApprovedStudent", ApprovedStudentSchema);