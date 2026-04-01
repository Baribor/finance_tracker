import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import Member from "@/models/Member";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "secretary" && session.user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const filter: Record<string, unknown> = {};
  if (session.user.role === "secretary" && session.user.group) {
    filter.group = session.user.group;
  }

  const members = await Member.find(filter)
    .select("-password")
    .populate("group", "name")
    .sort({ createdAt: -1 });
  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const body = await req.json();
  const { stateCode, name } = body;

  if (!stateCode || !name) {
    return NextResponse.json(
      { error: "State code and name are required" },
      { status: 400 }
    );
  }

  const existing = await Member.findOne({ stateCode: stateCode.trim() });
  if (existing) {
    return NextResponse.json(
      { error: "A member with this state code already exists" },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(stateCode.trim(), 12);

  const member = await Member.create({
    stateCode: stateCode.trim(),
    name: name.trim(),
    password: hashedPassword,
    role: "member",
    group: session.user.group || undefined,
    mustChangePassword: true,
  });

  const memberObj = member.toObject();
  const { password: _, ...memberWithoutPassword } = memberObj;
  void _;

  return NextResponse.json(memberWithoutPassword, { status: 201 });
}
