// file: models/ContactSetting.ts

import { Schema, models, model } from "mongoose";

const ContactSettingSchema = new Schema(
  {
    phone1: { type: String, default: "044 22725" },
    phone2: { type: String, default: "09783543901" },
    email: { type: String, default: "cu.hinthada@gmail.com" },
    address: {
      type: String,
      default:
        "No.28, Kayin Kyaung Street, TarNgar Se (South) Quarter, Hinthada Township, Ayeyarwaddy Region, Myanmar. Postcode – 100601",
    },
    website: { type: String, default: "ucsh.edu.mm" },
    facebookUrl: { type: String, default: "https://www.facebook.com" },
    facebookName: {
      type: String,
      default: "University of Computer Studies, Hinthada",
    },
    mapUrl: {
      type: String,
      default:
        "https://www.google.com/maps?q=University%20of%20Computer%20Studies%20Hinthada&output=embed",
    },
  },
  { timestamps: true }
);

export default models.ContactSetting ||
  model("ContactSetting", ContactSettingSchema);