// file: models/User.ts

import mongoose, { Schema, models, model } from "mongoose";

const degreeValues = [
  "B.C.Sc",
  "B.C.Tech",
  "M.C.Sc",
  "M.C.Tech",
  "D.C.Sc",
  "M.I.Sc",
  "Ph.D",
  "",
] as const;

const SocialLinksSchema = new Schema(
  {
    facebook: { type: String, default: "" },
    telegram: { type: String, default: "" },
    instagram: { type: String, default: "" },
    youtube: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    tiktok: { type: String, default: "" },
    viber: { type: String, default: "" },
    line: { type: String, default: "" },
    x: { type: String, default: "" },
    twitter: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    website: { type: String, default: "" },
  },
  { _id: false }
);

const ContactSchema = new Schema(
  {
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    company: { type: String, default: "" },
    position: { type: String, default: "" },
  },
  { _id: false }
);

const ExperienceSchema = new Schema(
  {
    company: { type: String, default: "" },
    position: { type: String, default: "" },
    employmentType: { type: String, default: "" },
    location: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    salary: { type: String, default: "" },
    website: { type: String, default: "" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    isCurrent: { type: Boolean, default: false },
    experienceYear: { type: String, default: "" },
  },
  { _id: false }
);

const UserSchema = new Schema(
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
      index: true,
    },

    password: {
      type: String,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin", "staff"], 
      default: "user",
      index: true,
    },

    position: { 
      type: String,
      default: "",
    },

    isBlocked: {
      type: Boolean,
      default: false,
      index: true,
    },

    image: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
    },

    graduatedYear: {
      type: String, // <-- Updated to String
      default: "",  // <-- Updated to empty string default
    },

    degree: {
      type: String,
      enum: degreeValues,
      default: "",
      trim: true,
      index: true,
    },

    contactInfo: {
      type: ContactSchema,
      default: () => ({}),
    },

    experiences: {
      type: [ExperienceSchema],
      default: [],
    },

    socialLinks: {
      type: SocialLinksSchema,
      default: () => ({}),
    },

    isProfilePublic: {
      type: Boolean,
      default: true,
    },

    profileVisibility: {
      type: String,
      enum: ["public"],
      default: "public",
    },

    languagePreference: {
      type: String,
      enum: ["en", "mm"],
      default: "en",
    },

    themePreference: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({
  name: "text",
  email: "text",
  degree: "text",
});

export type IUser = mongoose.InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export default models.User || model("User", UserSchema);