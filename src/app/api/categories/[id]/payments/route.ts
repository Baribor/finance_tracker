import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Member from "@/models/Member";
import Category from "@/models/Category";
import { authOptions } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const { id } = await params;

  const category = await Category.findById(id);
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  // Scope to secretary's group
  const groupMembers = session.user.group
    ? await Member.find({ group: session.user.group }).select("_id")
    : null;

  const filter: Record<string, unknown> = { category: id };
  if (groupMembers) {
    filter.member = { $in: groupMembers.map((m) => m._id) };
  }

  const payments = await Payment.find(filter)
    .populate("member", "name stateCode")
    .populate("recordedBy", "name")
    .sort({ date: -1 });

  return NextResponse.json({ category, payments });
}
