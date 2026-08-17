"use server";

import { connectDB } from "@/lib/mongodb";
import ApprovedStudent from "@/models/ApprovedStudent";
import { revalidatePath } from "next/cache";

export async function updateStudentRegistrationByName(name: string, registeredStatus: boolean) {
  try {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { success: false, message: "Please enter a valid student name." };
    }

    await connectDB();

    // Perform a case-insensitive match for the name
    const updatedStudent = await ApprovedStudent.findOneAndUpdate(
      { name: { $regex: new RegExp(`^${trimmedName}$`, "i") } },
      { $set: { registered: registeredStatus } },
      { new: true }
    ).lean();

    if (!updatedStudent) {
      return { success: false, message: `No student found matching "${trimmedName}".` };
    }

    // Refresh dashboard or admin data caches
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: `Successfully updated ${updatedStudent.name}'s registration status to ${registeredStatus}.`,
      student: JSON.parse(JSON.stringify(updatedStudent)),
    };
  } catch (error: any) {
    console.error("Failed to update student registration:", error);
    return { success: false, message: "A server error occurred while updating the student." };
  }
}