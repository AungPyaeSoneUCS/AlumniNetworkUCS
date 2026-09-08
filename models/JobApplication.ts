// file: models/JobApplication.ts

import mongoose, { Schema, models, model, type Model, type Types } from "mongoose";

export type JobApplicationDocument = {
  _id: Types.ObjectId;
  jobId: Types.ObjectId;
  applicant: Types.ObjectId;
  title: string;
  company: string;
  coverLetter: string;
  name: string;
  email: string;
  phone?: string;
  experienceId?: string;
  status: "pending" | "reviewed" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
};

const JobApplicationSchema = new Schema<JobApplicationDocument>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    applicant: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, default: "" },
    company: { type: String, default: "" },
    coverLetter: { type: String, default: "", trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "", trim: true },
    experienceId: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "reviewed", "accepted", "rejected"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

JobApplicationSchema.index({ applicant: 1, jobId: 1 });
JobApplicationSchema.index({ jobId: 1, applicant: 1, createdAt: -1 });

const JobApplication =
  (models.JobApplication as Model<JobApplicationDocument>) ||
  model<JobApplicationDocument>("JobApplication", JobApplicationSchema);

export default JobApplication;
