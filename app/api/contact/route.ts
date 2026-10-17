// file: app/api/contact/route.ts

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

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

function serializeContact(row: any) {
  if (!row) return row;
  const { id, ...rest } = row;
  return { ...rest, _id: String(id) };
}

export async function GET() {
  try {
    let contact = await prisma.contactSetting.findFirst();

    if (!contact) {
      contact = await prisma.contactSetting.create({ data: defaultContact });
    }

    return NextResponse.json(serializeContact(contact));
  } catch (error) {
    console.error("Get contact failed:", error);
    return NextResponse.json(defaultContact);
  }
}
