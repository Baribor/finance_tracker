import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Member from "@/models/Member";
import { authOptions } from "@/lib/auth";

// Transfer secretary role to another member in the same group
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const { memberId } = await req.json();

  if (!memberId) {
    return NextResponse.json(
      { error: "Target member ID is required" },
      { status: 400 }
    );
  }

  const currentSecretary = await Member.findById(session.user.id);
  if (!currentSecretary) {
    return NextResponse.json({ error: "Secretary not found" }, { status: 404 });
  }

  const targetMember = await Member.findById(memberId);
  if (!targetMember) {
    return NextResponse.json({ error: "Target member not found" }, { status: 404 });
  }

  if (targetMember.group?.toString() !== currentSecretary.group?.toString()) {
    return NextResponse.json(
      { error: "Target member must be in the same group" },
      { status: 400 }
    );
  }

  if (targetMember.role !== "member") {
    return NextResponse.json(
      { error: "Can only transfer role to a regular member" },
      { status: 400 }
    );
  }

  if (!targetMember.isActive || targetMember.serviceStatus === "completed") {
    return NextResponse.json(
      { error: "Target member must be active and currently serving" },
      { status: 400 }
    );
  }

  // Swap roles
  currentSecretary.role = "member";
  targetMember.role = "secretary";

  await Promise.all([currentSecretary.save(), targetMember.save()]);

  return NextResponse.json({
    message: `Secretary role transferred to ${targetMember.name}`,
  });
}
