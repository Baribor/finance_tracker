import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import Member from "@/models/Member";
import { authOptions } from "@/lib/auth";

// Secretary resets a member's password to their state code
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const body = await req.json();
  const { memberId } = body;

  if (!memberId) {
    return NextResponse.json(
      { error: "Member ID is required" },
      { status: 400 }
    );
  }

  const member = await Member.findById(memberId);
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (member.role !== "member") {
    return NextResponse.json(
      { error: "Can only reset passwords for members" },
      { status: 400 }
    );
  }

  // Reset password to state code
  member.password = await bcrypt.hash(member.stateCode, 12);
  member.mustChangePassword = true;
  await member.save();

  return NextResponse.json({
    message: `Password for ${member.name} has been reset to their state code`,
  });
}
