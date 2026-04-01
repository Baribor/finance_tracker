import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Member from "@/models/Member";
import { authOptions } from "@/lib/auth";

// GET: List active serving members of the caller's group (accessible by all authenticated group members)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.group) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const members = await Member.find({
    group: session.user.group,
    isActive: true,
    serviceStatus: "serving",
  })
    .select("name stateCode role")
    .sort({ role: 1, name: 1 });

  return NextResponse.json(members);
}
