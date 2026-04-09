import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import SignupRequest from "@/models/SignupRequest";
import Group from "@/models/Group";
import Member from "@/models/Member";
import { authOptions } from "@/lib/auth";
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const { id } = await params;
  const { action, rejectionReason } = await req.json();

  if (!action || !["approve", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "Action must be 'approve' or 'reject'" },
      { status: 400 }
    );
  }

  const request = await SignupRequest.findById(id);
  if (!request) {
    return NextResponse.json(
      { error: "Signup request not found" },
      { status: 404 }
    );
  }

  if (request.status !== "pending") {
    return NextResponse.json(
      { error: "This request has already been reviewed" },
      { status: 400 }
    );
  }

  if (action === "reject") {
    request.status = "rejected";
    request.reviewedBy = session.user.id as unknown as typeof request.reviewedBy;
    request.reviewedAt = new Date();
    request.rejectionReason = rejectionReason?.trim() || "";
    await request.save();

    // Send rejection email — non-blocking, failure should not break the response
    if (request.secretaryEmail) {
      sendRejectionEmail({
        to: request.secretaryEmail,
        secretaryName: request.secretaryName,
        groupName: request.groupName,
        reason: request.rejectionReason || undefined,
      }).catch((err) =>
        console.error("[email] Failed to send rejection email:", err)
      );
    }

    await logAudit({
      action: "signup_request.reject",
      performedBy: session.user.id,
      targetType: "SignupRequest",
      targetId: id,
      details: `Rejected signup request for group "${request.groupName}"`,
      meta: { groupName: request.groupName, secretaryName: request.secretaryName },
    });

    return NextResponse.json({ message: "Request rejected" });
  }

  // Approve: create the group and secretary account
  const existingGroup = await Group.findOne({
    name: { $regex: new RegExp(`^${request.groupName}$`, "i") },
  });
  if (existingGroup) {
    return NextResponse.json(
      { error: "A group with this name already exists" },
      { status: 400 }
    );
  }

  const existingMember = await Member.findOne({
    stateCode: request.secretaryStateCode,
  });
  if (existingMember) {
    return NextResponse.json(
      { error: "This state code is already registered to an existing member" },
      { status: 400 }
    );
  }

  const group = await Group.create({
    name: request.groupName,
    description: request.groupDescription || "",
  });

  const hashedPassword = await bcrypt.hash(request.secretaryStateCode, 12);
  await Member.create({
    stateCode: request.secretaryStateCode,
    name: request.secretaryName,
    password: hashedPassword,
    role: "secretary",
    group: group._id,
    mustChangePassword: true,
  });

  request.status = "approved";
  request.reviewedBy = session.user.id as unknown as typeof request.reviewedBy;
  request.reviewedAt = new Date();
  await request.save();

  // Send approval email — non-blocking, failure should not break the response
  if (request.secretaryEmail) {
    sendApprovalEmail({
      to: request.secretaryEmail,
      secretaryName: request.secretaryName,
      groupName: request.groupName,
      stateCode: request.secretaryStateCode,
    }).catch((err) =>
      console.error("[email] Failed to send approval email:", err)
    );
  }
  await logAudit({
    action: "signup_request.approve",
    performedBy: session.user.id,
    targetType: "SignupRequest",
    targetId: id,
    details: `Approved signup request — created group "${group.name}" with secretary ${request.secretaryName}`,
    meta: { groupName: group.name, secretaryName: request.secretaryName, groupId: group._id.toString() },
  });
  return NextResponse.json({
    message: `Group "${group.name}" created and secretary account activated`,
    group: { id: group._id, name: group.name },
  });
}
