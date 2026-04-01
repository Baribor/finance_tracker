import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import TransferRequest from "@/models/TransferRequest";
import Member from "@/models/Member";
import { authOptions } from "@/lib/auth";

// GET: List transfer requests relevant to the secretary's group
// - Incoming: requests where toGroup is the secretary's group (secretary creates these)
// - Outgoing: requests where fromGroup is the secretary's group (secretary approves/rejects these)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const groupId = session.user.group;

  const requests = await TransferRequest.find({
    $or: [{ fromGroup: groupId }, { toGroup: groupId }],
  })
    .populate("member", "name stateCode")
    .populate("fromGroup", "name")
    .populate("toGroup", "name")
    .populate("requestedBy", "name")
    .populate("resolvedBy", "name")
    .sort({ createdAt: -1 });

  return NextResponse.json(requests);
}

// POST: Secretary of the NEW group requests a member transfer from another group
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const { memberStateCode } = await req.json();

  if (!memberStateCode) {
    return NextResponse.json(
      { error: "Member state code is required" },
      { status: 400 }
    );
  }

  const member = await Member.findOne({
    stateCode: memberStateCode.trim(),
    role: "member",
    isActive: true,
  });

  if (!member) {
    return NextResponse.json(
      { error: "Active member with this state code not found" },
      { status: 404 }
    );
  }

  const toGroupId = session.user.group;

  if (!toGroupId) {
    return NextResponse.json(
      { error: "You are not assigned to any group" },
      { status: 400 }
    );
  }

  const fromGroupId = member.group?.toString();

  if (!fromGroupId) {
    return NextResponse.json(
      { error: "Member is not assigned to any group" },
      { status: 400 }
    );
  }

  if (fromGroupId === toGroupId) {
    return NextResponse.json(
      { error: "Member is already in your group" },
      { status: 400 }
    );
  }

  // Check for existing pending request
  const existing = await TransferRequest.findOne({
    member: member._id,
    status: "pending",
  });

  if (existing) {
    return NextResponse.json(
      { error: "A pending transfer request already exists for this member" },
      { status: 400 }
    );
  }

  const request = await TransferRequest.create({
    member: member._id,
    fromGroup: fromGroupId,
    toGroup: toGroupId,
    requestedBy: session.user.id,
  });

  const populated = await TransferRequest.findById(request._id)
    .populate("member", "name stateCode")
    .populate("fromGroup", "name")
    .populate("toGroup", "name")
    .populate("requestedBy", "name");

  return NextResponse.json(populated, { status: 201 });
}
