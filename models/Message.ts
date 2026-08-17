// file: models/Message.ts

import mongoose, { Schema, models, model } from "mongoose";

const MessageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },

    seen: {
      type: Boolean,
      default: false,
    },

    // NEW: Viber/Telegram style feature flags
    isDeleted: {
      type: Boolean,
      default: false,
    },

    isEdited: {
      type: Boolean,
      default: false,
    },

    deletedBy: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Message = models.Message || model("Message", MessageSchema);

export default Message;