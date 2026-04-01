import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Group from "@/models/Group";
import Member from "@/models/Member";
import Payment from "@/models/Payment";
import Expense from "@/models/Expense";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const [groupCount, totalMembers, totalIncome, totalExpenses] =
    await Promise.all([
      Group.countDocuments({ isActive: true }),
      Member.countDocuments({ role: { $in: ["member", "secretary"] }, isActive: true }),
      Payment.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
      Expense.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
    ]);

  const income = totalIncome[0]?.total || 0;
  const expenses = totalExpenses[0]?.total || 0;

  return NextResponse.json({
    groupCount,
    totalMembers,
    totalIncome: income,
    totalExpenses: expenses,
    balance: income - expenses,
  });
}
