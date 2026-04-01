import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Expense from "@/models/Expense";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const filter: Record<string, unknown> = {};
  if (session.user.group) {
    filter.group = session.user.group;
  }
  const expenses = await Expense.find(filter)
    .populate("recordedBy", "name")
    .sort({ date: -1 });

  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const body = await req.json();
  const { description, amount, date, category } = body;

  if (!description || !amount || !category) {
    return NextResponse.json(
      { error: "Description, amount, and category are required" },
      { status: 400 }
    );
  }

  const expense = await Expense.create({
    description: description.trim(),
    amount: Number(amount),
    date: date || new Date(),
    category: category.trim(),
    group: session.user.group || undefined,
    recordedBy: session.user.id,
  });

  const populated = await Expense.findById(expense._id).populate(
    "recordedBy",
    "name"
  );

  return NextResponse.json(populated, { status: 201 });
}
