// file: models/Job.ts

import mongoose, { Schema, models, model } from "mongoose";

const JobSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    company: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      enum: ["Full Time", "Part Time", "Remote", "Internship"],
      default: "Full Time",
    },

    description: {
      type: String,
      default: "",
    },

    salary: {
      type: String,
      default: "",
    },

    applyLink: {
      type: String,
      default: "",
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Job = models.Job || model("Job", JobSchema);

export default Job;