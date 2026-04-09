import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import TransferRequest from "@/models/TransferRequest";
import Member from "@/models/Member";
import { authOptions } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// PATCH: Approve or reject a transfer request (only the fromGroup secretary can do this)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const { id } = await params;
  const { action } = await req.json();

  if (!action || !["approve", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "Action must be 'approve' or 'reject'" },
      { status: 400 }
    );
  }

  const request = await TransferRequest.findById(id);
  if (!request) {
    return NextResponse.json(
      { error: "Transfer request not found" },
      { status: 404 }
    );
  }

  if (request.status !== "pending") {
    return NextResponse.json(
      { error: "This request has already been resolved" },
      { status: 400 }
    );
  }

  // Only the secretary of the fromGroup can approve/reject
  if (request.fromGroup.toString() !== session.user.group) {
    return NextResponse.json(
      { error: "Only the current group's secretary can approve or reject" },
      { status: 403 }
    );
  }

  request.status = action === "approve" ? "approved" : "rejected";
  request.resolvedBy = session.user.id as unknown as typeof request.resolvedBy;
  request.resolvedAt = new Date();
  await request.save();

  // If approved, move the member to the new group
  if (action === "approve") {
    await Member.findByIdAndUpdate(request.member, {
      group: request.toGroup,
    });
  }

  const populated = await TransferRequest.findById(id)
    .populate("member", "name stateCode")
    .populate("fromGroup", "name")
    .populate("toGroup", "name")
    .populate("requestedBy", "name")
    .populate("resolvedBy", "name");

  await logAudit({
    action: action === "approve" ? "transfer.approve" : "transfer.reject",
    performedBy: session.user.id,
    targetType: "TransferRequest",
    targetId: id,
    group: session.user.group,
    details: `${action === "approve" ? "Approved" : "Rejected"} transfer request for ${(populated?.member as unknown as { name: string })?.name ?? "unknown"}`,
  });

  return NextResponse.json(populated);
}
