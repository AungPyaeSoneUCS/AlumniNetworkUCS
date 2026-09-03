// file: models/Notification.ts

import mongoose, { Schema, models, model, type Model, type Types } from "mongoose";

export type NotificationType = "message" | "system" | "job" | "post" | "admin" | "like" | "comment";

export type NotificationDocument = {
  _id: Types.ObjectId;
  receiver: Types.ObjectId;
  sender?: Types.ObjectId | null;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const NotificationSchema = new Schema<NotificationDocument>(
  {
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    type: {
      type: String,
      enum: ["message", "system", "job", "post", "admin", "like", "comment"],
      default: "message",
      index: true,
    },

    title: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },

    body: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    link: {
      type: String,
      default: "",
      trim: true,
    },

    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ receiver: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ receiver: 1, createdAt: -1 });

const Notification =
  (models.Notification as Model<NotificationDocument>) ||
  model<NotificationDocument>("Notification", NotificationSchema);

export default Notification;