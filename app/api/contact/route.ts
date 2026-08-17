// file: app/api/contact/route.ts

import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import ContactSetting from "@/models/ContactSetting";

const defaultContact = {
  phone1: "044 22725",
  phone2: "09783543901",
  email: "cu.hinthada@gmail.com",
  address:
    "No.28, Kayin Kyaung Street, TarNgar Se (South) Quarter, Hinthada Township, Ayeyarwaddy Region, Myanmar. Postcode – 100601",
  website: "ucsh.edu.mm",
  facebookUrl: "https://www.facebook.com",
  facebookName: "University of Computer Studies, Hinthada",
  mapUrl:
    "https://www.google.com/maps?q=University%20of%20Computer%20Studies%20Hinthada&output=embed",
};

export async function GET() {
  try {
    await connectDB();

    let contact = await ContactSetting.findOne().lean();

    if (!contact) {
      contact = await ContactSetting.create(defaultContact);
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Get contact failed:", error);
    return NextResponse.json(defaultContact);
  }
}