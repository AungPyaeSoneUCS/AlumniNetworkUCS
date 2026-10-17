"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateStudentRegistrationByName(name: string, registeredStatus: boolean) {
  try {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { success: false, message: "Please enter a valid student name." };
    }

    const candidates = await prisma.approvedStudent.findMany({
      where: { name: { contains: trimmedName } },
    });
    const found = candidates.find(
      (c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (!found) {
      return { success: false, message: `No student found matching "${trimmedName}".` };
    }

    const updatedStudent = await prisma.approvedStudent.update({
      where: { id: found.id },
      data: { registered: registeredStatus },
    });

    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: `Successfully updated ${updatedStudent.name}'s registration status to ${registeredStatus}.`,
      student: updatedStudent,
    };
  } catch (error: any) {
    console.error("Failed to update student registration:", error);
    return { success: false, message: "A server error occurred while updating the student." };
  }
}