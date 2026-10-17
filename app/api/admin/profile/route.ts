// file: app/api/admin/profile/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(req: Request) {
  try {
    // 1. Verify the user is authenticated
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // 2. Get the data sent from client-form.tsx
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 }
      );
    }

    // 3. Check if they are changing their email, and if it's already taken
    if (email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json(
          { error: "This email is already in use by another account." },
          { status: 400 }
        );
      }
    }

    // 4. Prepare the data to update
    const updateData: { name: string; email: string; password?: string } = {
      name,
      email,
    };

    // 5. If they provided a new password, hash it before saving
    if (password) {
      if (password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters." },
          { status: 400 }
        );
      }
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // 6. Update the database
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Admin user not found in database." },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData,
    });

    // 7. Return success!
    return NextResponse.json(
      { success: true, message: "Profile updated successfully." },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error("Profile API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
