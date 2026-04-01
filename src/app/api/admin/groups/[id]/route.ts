import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Group from "@/models/Group";
import Member from "@/models/Member";
import Payment from "@/models/Payment";
import Expense from "@/models/Expense";
import { authOptions } from "@/lib/auth";

// Get detailed info for a specific group (read-only for admin)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const { id } = await params;

  const group = await Group.findById(id);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const members = await Member.find({ group: id })
    .select("-password")
    .sort({ role: 1, name: 1 });

  const memberIds = members.map((m) => m._id);

  const [totalIncome, totalExpenses] = await Promise.all([
    Payment.aggregate([
      { $match: { member: { $in: memberIds } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Expense.aggregate([
      { $match: { recordedBy: { $in: memberIds } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const recentPayments = await Payment.find({ member: { $in: memberIds } })
    .populate("member", "name stateCode")
    .populate("category", "name amount")
    .sort({ createdAt: -1 })
    .limit(10);

  const recentExpenses = await Expense.find({ recordedBy: { $in: memberIds } })
    .populate("recordedBy", "name")
    .sort({ createdAt: -1 })
    .limit(10);

  return NextResponse.json({
    group,
    members,
    totalIncome: totalIncome[0]?.total || 0,
    totalExpenses: totalExpenses[0]?.total || 0,
    balance: (totalIncome[0]?.total || 0) - (totalExpenses[0]?.total || 0),
    recentPayments,
    recentExpenses,
  });
}
