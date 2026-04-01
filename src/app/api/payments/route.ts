import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Member from "@/models/Member";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");

  const filter: Record<string, unknown> = {};
  if (memberId) {
    filter.member = memberId;
  } else if (session.user.group) {
    const groupMembers = await Member.find({ group: session.user.group }).select("_id");
    filter.member = { $in: groupMembers.map((m) => m._id) };
  }

  const payments = await Payment.find(filter)
    .populate("member", "name stateCode")
    .populate("category", "name type amount")
    .populate("recordedBy", "name")
    .sort({ date: -1 });

  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const body = await req.json();
  const { member, category, amount, date, note } = body;

  if (!member || !category || !amount) {
    return NextResponse.json(
      { error: "Member, category, and amount are required" },
      { status: 400 }
    );
  }

  const payment = await Payment.create({
    member,
    category,
    amount: Number(amount),
    date: date || new Date(),
    method: "direct",
    recordedBy: session.user.id,
    note: note?.trim() || "",
  });

  const populated = await Payment.findById(payment._id)
    .populate("member", "name stateCode")
    .populate("category", "name type amount")
    .populate("recordedBy", "name");

  return NextResponse.json(populated, { status: 201 });
}
