import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Member from "@/models/Member";
import Payment from "@/models/Payment";
import { authOptions } from "@/lib/auth";

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
    const result = member.toObject();
    delete (result as unknown as Record<string, unknown>).password;
    return NextResponse.json(result);
  }

  const member = await Member.findByIdAndUpdate(id, body, {
    new: true,
  }).select("-password");

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  return NextResponse.json(member);
}

// Hard delete — only allowed if the member has no payment records
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

  // Check for any payment records
  const paymentCount = await Payment.countDocuments({ member: id });
  if (paymentCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete member with existing payment records. Deactivate instead." },
      { status: 400 }
    );
  }

  await Member.findByIdAndDelete(id);

  return NextResponse.json({ message: "Member deleted" });
}
