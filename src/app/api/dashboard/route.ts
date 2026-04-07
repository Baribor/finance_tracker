import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Expense from "@/models/Expense";
import Member from "@/models/Member";
import Category from "@/models/Category";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  // Scope to group for secretary/member
  const groupId = session.user.group;
  const memberFilter: Record<string, unknown> = { isActive: true, role: { $in: ["member", "secretary"] } };
  if (groupId) memberFilter.group = groupId;

  // Get member IDs in group for filtering payments
  const groupMembers = groupId
    ? await Member.find({ group: groupId }).select("_id")
    : null;
  const memberIds = groupMembers ? groupMembers.map((m) => m._id) : null;

  const paymentFilter = memberIds
    ? {
        $or: [
          { member: { $in: memberIds } },
          { isAnonymous: true, recordedBy: { $in: memberIds } },
        ],
      }
    : {};
  const categoryFilter: Record<string, unknown> = { isActive: true };

  const [totalIncome, totalExpenses, memberCount, categoryCount] =
    await Promise.all([
      Payment.aggregate([
        { $match: paymentFilter },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Expense.aggregate([
        ...(groupId ? [{ $match: { recordedBy: { $in: memberIds } } }] : []),
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Member.countDocuments(memberFilter),
      Category.countDocuments(categoryFilter),
    ]);

  const income = totalIncome[0]?.total || 0;
  const expenses = totalExpenses[0]?.total || 0;

  const recentPayments = await Payment.find(paymentFilter)
    .populate("member", "name stateCode")
    .populate("category", "name")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const expenseFilter: Record<string, unknown> = {};
  if (groupId) {
    expenseFilter.recordedBy = { $in: memberIds };
  }

  const recentExpenses = await Expense.find(expenseFilter)
    .populate("recordedBy", "name")
    .sort({ createdAt: -1 })
    .limit(5);

  return NextResponse.json({
    totalIncome: income,
    totalExpenses: expenses,
    balance: income - expenses,
    memberCount,
    categoryCount,
    recentPayments,
    recentExpenses,
  });
}
