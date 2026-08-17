// file: models/Post.ts

import mongoose, { Schema, models, model } from "mongoose";

const CommentSchema = new Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

const PostSchema = new Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },

    category: {
      type: String,
      enum: ["General", "Job", "Event", "News"],
      default: "General",
      index: true,
    },

    // old single image support
    image: {
      type: String,
      default: "",
    },

    // new multiple images support: 1 to 3 photos
    images: {
      type: [String],
      default: [],
      validate: {
        validator(value: string[]) {
          return value.length <= 3;
        },
        message: "Maximum 3 photos allowed",
      },
    },

    likes: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },

    comments: {
      type: [CommentSchema],
      default: [],
    },

    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

PostSchema.index({
  content: "text",
  category: "text",
});

export type IPost = mongoose.InferSchemaType<typeof PostSchema> & {
  _id: mongoose.Types.ObjectId;
};

export default models.Post || model("Post", PostSchema);