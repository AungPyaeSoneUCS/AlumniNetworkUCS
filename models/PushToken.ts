// file: models/PushToken.ts

import mongoose, { Schema, models, model, type Model, type Types } from "mongoose";

export type PushTokenDocument = {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  expoPushToken: string;
  platform: string;
  createdAt: Date;
  updatedAt: Date;
};

const PushTokenSchema = new Schema<PushTokenDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    expoPushToken: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: ["android", "ios", "web"],
      default: "android",
    },
  },
  { timestamps: true }
);

PushTokenSchema.index({ user: 1, expoPushToken: 1 });

const PushToken =
  (models.PushToken as Model<PushTokenDocument>) ||
  model<PushTokenDocument>("PushToken", PushTokenSchema);

export default PushToken;
