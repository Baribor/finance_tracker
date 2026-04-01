import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import Group from "@/models/Group";
import Member from "@/models/Member";
import { authOptions } from "@/lib/auth";

// Get all groups
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const groups = await Group.find({}).sort({ createdAt: -1 });

  // Get secretary and member counts per group
  const groupsWithCounts = await Promise.all(
    groups.map(async (group) => {
      const secretary = await Member.findOne({
        group: group._id,
        role: "secretary",
      }).select("name stateCode");
      const memberCount = await Member.countDocuments({
        group: group._id,
        role: { $in: ["member", "secretary"] },
        isActive: true,
      });
      return {
        ...group.toObject(),
        secretary,
        memberCount,
      };
    })
  );

  return NextResponse.json(groupsWithCounts);
}

// Create a new group with its secretary
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const body = await req.json();
  const { groupName, groupDescription, secretaryName, secretaryStateCode } = body;

  if (!groupName || !secretaryName || !secretaryStateCode) {
    return NextResponse.json(
      { error: "Group name, secretary name, and secretary state code are required" },
      { status: 400 }
    );
  }

  // Check for duplicates
  const existingGroup = await Group.findOne({ name: groupName.trim() });
  if (existingGroup) {
    return NextResponse.json(
      { error: "A group with this name already exists" },
      { status: 400 }
    );
  }

  const existingMember = await Member.findOne({ stateCode: secretaryStateCode.trim() });
  if (existingMember) {
    return NextResponse.json(
      { error: "A member with this state code already exists" },
      { status: 400 }
    );
  }

  // Create group
  const group = await Group.create({
    name: groupName.trim(),
    description: groupDescription?.trim() || "",
  });

  // Create secretary for the group
  const hashedPassword = await bcrypt.hash(secretaryStateCode.trim(), 12);
  await Member.create({
    stateCode: secretaryStateCode.trim(),
    name: secretaryName.trim(),
    password: hashedPassword,
    role: "secretary",
    group: group._id,
    mustChangePassword: true,
  });

  return NextResponse.json(group, { status: 201 });
}
