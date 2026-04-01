import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { seedSecretary } from "@/lib/seed";

export async function GET() {
  await dbConnect();
  await seedSecretary();
  return NextResponse.json({ message: "Database seeded successfully" });
}
