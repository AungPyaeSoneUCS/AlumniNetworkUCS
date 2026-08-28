import mongoose, { Schema, models, model, Document } from "mongoose";

// 1. Define the TypeScript Interface
export interface IVoteUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: "ADMIN" | "TEAM" | "VOTER";
  hasVoted: boolean;
  votedProjectId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Create the Mongoose Schema
const VoteUserSchema = new Schema<IVoteUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Prevents password from being returned in normal queries
    },
    role: {
      type: String,
      enum: ["ADMIN", "TEAM", "VOTER"],
      default: "VOTER",
    },
    hasVoted: {
      type: Boolean,
      default: false,
    },
    votedProjectId: {
      type: Schema.Types.ObjectId,
      ref: "VoteProject",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "vote_users", // Forces MongoDB to use this exact table name
  }
);

// 3. Export the Model
export default models.VoteUser || model<IVoteUser>("VoteUser", VoteUserSchema);