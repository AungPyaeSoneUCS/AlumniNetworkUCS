import mongoose, { Schema, models, model, Document } from "mongoose";

// 1. Define the TypeScript Interface
export interface IVoteProject extends Document {
  _id: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId; // References the TEAM account
  title: string;
  description: string;
  languagesAndTools: string[];
  photos: string[];
  voteCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Create the Mongoose Schema
const VoteProjectSchema = new Schema<IVoteProject>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "VoteUser", // Links to the vote_users collection
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    languagesAndTools: {
      type: [String],
      default: [], // e.g., ["NextJS", "MongoDB", "Tailwind"]
    },
    photos: {
      type: [String],
      default: [], // Array of URLs from your cloud storage (S3, Cloudinary, etc.)
    },
    voteCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "vote_projects", // Forces MongoDB to use this exact table name
  }
);

// 3. Export the Model
export default models.VoteProject || model<IVoteProject>("VoteProject", VoteProjectSchema);