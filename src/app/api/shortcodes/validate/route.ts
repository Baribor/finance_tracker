import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import ShortCode from "@/models/ShortCode";
import Payment from "@/models/Payment";
import { authOptions } from "@/lib/auth";

// Secretary validates and redeems a short code
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const body = await req.json();
  const { code } = body;

  if (!code) {
    return NextResponse.json(
      { error: "Short code is required" },
      { status: 400 }
    );
  }

  const shortCode = await ShortCode.findOne({
    code: code.trim().toUpperCase(),
  })
    .populate("member", "name stateCode")
    .populate("category", "name type amount");

  if (!shortCode) {
    return NextResponse.json(
      { error: "Invalid short code" },
      { status: 404 }
    );
  }

  if (shortCode.isUsed) {
    return NextResponse.json(
      { error: "This short code has already been used" },
      { status: 400 }
    );
  }

  if (new Date() > shortCode.expiresAt) {
    return NextResponse.json(
      { error: "This short code has expired" },
      { status: 400 }
    );
  }

  // Create payment
  const payment = await Payment.create({
    member: shortCode.member._id,
    category: shortCode.category._id,
    amount: shortCode.amount,
    method: "shortcode",
    shortCode: shortCode.code,
    recordedBy: session.user.id,
  });

  // Mark short code as used
  shortCode.isUsed = true;
  shortCode.usedAt = new Date();
  await shortCode.save();

  const populated = await Payment.findById(payment._id)
    .populate("member", "name stateCode")
    .populate("category", "name type amount")
    .populate("recordedBy", "name");

  return NextResponse.json(
    {
      payment: populated,
      message: `Payment of ₦${shortCode.amount} recorded for ${(shortCode.member as unknown as { name: string }).name}`,
    },
    { status: 201 }
  );
}
