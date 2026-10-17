// file: app/api/vote/users/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidId } from "@/lib/db";

async function verifyAdminAccess() {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    !session.user ||
    (session.user as any).role !== "ADMIN" ||
    !(session.user as any).isVoteSystem
  ) {
    return false;
  }
  return true;
}

const isValidDomain = (email: string) => {
  const cleanEmail = email.trim().toLowerCase();
  return cleanEmail.endsWith("@gmail.com") || cleanEmail.endsWith("@ucsh.edu.mm");
};

export async function POST(req: Request) {
  try {
    if (!(await verifyAdminAccess())) {
      return NextResponse.json(
        { error: "Unauthorized: Only Admins can create accounts." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Name, email, password, and role are required." },
        { status: 400 }
      );
    }

    if (!isValidDomain(email)) {
      return NextResponse.json(
        { error: "Email must end with @gmail.com or @ucsh.edu.mm only." },
        { status: 400 }
      );
    }

    if (!["TEAM", "VOTER"].includes(role.toUpperCase())) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'TEAM' or 'VOTER'." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.voteUser.findFirst({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.voteUser.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: role.toUpperCase(),
      },
    });

    return NextResponse.json(
      {
        message: `${newUser.role} account created successfully.`,
        user: {
          id: newUser.id,
          _id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Failed to create VoteUser:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    if (!(await verifyAdminAccess())) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get("role");

    const where: any = roleFilter
      ? { role: roleFilter.toUpperCase() }
      : { role: { not: "ADMIN" } };

    const users = await prisma.voteUser.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const shaped = users.map((u) => ({
      id: u.id,
      _id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      hasVoted: u.hasVoted,
      votedProjectId: u.votedProjectId,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return NextResponse.json(shaped, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch VoteUsers:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!(await verifyAdminAccess())) {
      return NextResponse.json(
        { error: "Unauthorized: Only Admins can update accounts." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, name, email, role, password } = body;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required for updating." },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (role) updateData.role = role.toUpperCase();

    if (email) {
      const normalizedEmail = email.trim().toLowerCase();

      if (!isValidDomain(normalizedEmail)) {
        return NextResponse.json(
          { error: "Email must end with @gmail.com or @ucsh.edu.mm only." },
          { status: 400 }
        );
      }

      const existingEmail = await prisma.voteUser.findFirst({
        where: { email: normalizedEmail, id: { not: id } },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: "This email is already in use by another account." },
          { status: 409 }
        );
      }
      updateData.email = normalizedEmail;
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.voteUser.update({
      where: { id },
      data: updateData,
    });

    const shaped = {
      id: updatedUser.id,
      _id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      hasVoted: updatedUser.hasVoted,
      votedProjectId: updatedUser.votedProjectId,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    return NextResponse.json(
      { message: "Account updated successfully.", user: shaped },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    console.error("Failed to update VoteUser:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!(await verifyAdminAccess())) {
      return NextResponse.json(
        { error: "Unauthorized: Only Admins can delete accounts." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required to delete." },
        { status: 400 }
      );
    }

    const deletedUser = await prisma.voteUser.deleteMany({
      where: { id },
    });

    if (deletedUser.count === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Account deleted successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to delete VoteUser:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}