import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import Member from "@/models/Member";
import { authOptions } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

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

  await logAudit({
    action: "member.password_reset",
    performedBy: session.user.id,
    targetType: "Member",
    targetId: memberId,
    group: session.user.group,
    details: `Reset password for ${member.name} (${member.stateCode})`,
    meta: { memberName: member.name, stateCode: member.stateCode },
  });

  return NextResponse.json({
    message: `Password for ${member.name} has been reset to their state code`,
  });
}
