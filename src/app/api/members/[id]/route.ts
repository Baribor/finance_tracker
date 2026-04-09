import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Member from "@/models/Member";
import { authOptions } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

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
  const body = await req.json();

  // Handle service completion
  if (body.serviceStatus === "completed") {
    const member = await Member.findById(id);
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    if (member.role === "secretary") {
      return NextResponse.json(
        { error: "Transfer secretary role before marking service as completed" },
        { status: 400 }
      );
    }
    member.serviceStatus = "completed";
    member.serviceCompletedAt = new Date();
    await member.save();

    await logAudit({
      action: "member.service_completed",
      performedBy: session.user.id,
      targetType: "Member",
      targetId: id,
      group: session.user.group,
      details: `Marked ${member.name} (${member.stateCode}) as service completed`,
      meta: { memberName: member.name, stateCode: member.stateCode },
    });

    const result = member.toObject();
    delete (result as unknown as Record<string, unknown>).password;
    return NextResponse.json(result);
  }

  // Track deactivation/activation
  const prevMember = body.isActive !== undefined ? await Member.findById(id) : null;

  const member = await Member.findByIdAndUpdate(id, body, {
    new: true,
  }).select("-password");

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (prevMember && body.isActive !== undefined && body.isActive !== prevMember.isActive) {
    await logAudit({
      action: body.isActive ? "member.activate" : "member.deactivate",
      performedBy: session.user.id,
      targetType: "Member",
      targetId: id,
      group: session.user.group,
      details: `${body.isActive ? "Activated" : "Deactivated"} member ${member.name} (${member.stateCode})`,
      meta: { memberName: member.name, stateCode: member.stateCode },
    });
  }

  return NextResponse.json(member);
}

// Soft delete — deactivate the member
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const { id } = await params;

  const member = await Member.findById(id);
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (member.role === "secretary") {
    return NextResponse.json(
      { error: "Cannot delete a secretary" },
      { status: 400 }
    );
  }

  member.isActive = false;
  await member.save();

  await logAudit({
    action: "member.delete",
    performedBy: session.user.id,
    targetType: "Member",
    targetId: id,
    group: session.user.group,
    details: `Soft-deleted member ${member.name} (${member.stateCode})`,
    meta: { memberName: member.name, stateCode: member.stateCode },
  });

  return NextResponse.json({ message: "Member deleted" });
}
