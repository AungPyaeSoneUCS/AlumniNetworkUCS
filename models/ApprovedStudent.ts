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
      type: Number,
      required: true,
      min: [2020, "Graduated year must be at least 2020."],
      validate: {
        validator: function (value: number) {
          const maxAllowedYear = new Date().getFullYear() + 1;
          return value <= maxAllowedYear;
        },
        message: (props: { value: number }) =>
          `Graduated year cannot be greater than ${new Date().getFullYear() + 1}.`,
      },
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