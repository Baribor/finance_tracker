import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import ShortCode from "@/models/ShortCode";
import Category from "@/models/Category";
import { authOptions } from "@/lib/auth";

function generate4CharCode(): string {
  return crypto.randomBytes(2).toString("hex").toUpperCase();
}

// Generate a short code (member-facing)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.group) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const body = await req.json();
  const { categoryId } = body;

  if (!categoryId) {
    return NextResponse.json(
      { error: "Category is required" },
      { status: 400 }
    );
  }

  const category = await Category.findById(categoryId);
  if (!category) {
    return NextResponse.json(
      { error: "Category not found" },
      { status: 404 }
    );
  }

  // Prevent duplicate active code for the same category
  const existingCode = await ShortCode.findOne({
    member: session.user.id,
    category: categoryId,
    isUsed: false,
    isDeleted: { $ne: true },
    expiresAt: { $gt: new Date() },
  });
  if (existingCode) {
    return NextResponse.json(
      { error: "You already have an active code for this category" },
      { status: 400 }
    );
  }

  // Generate unique 4-character code (unique within group)
  const groupId = session.user.group;
  let code: string;
  let attempts = 0;
  do {
    code = generate4CharCode();
    const existing = await ShortCode.findOne({ code, group: groupId });
    if (!existing) break;
    attempts++;
  } while (attempts < 20);

  if (attempts >= 20) {
    return NextResponse.json(
      { error: "Unable to generate a unique code. Please try again." },
      { status: 500 }
    );
  }

  const shortCode = await ShortCode.create({
    code,
    member: session.user.id,
    group: groupId,
    category: categoryId,
    amount: category.amount,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });

  return NextResponse.json(
    {
      code: shortCode.code,
      amount: shortCode.amount,
      expiresAt: shortCode.expiresAt,
      categoryName: category.name,
    },
    { status: 201 }
  );
}

// Get member's short codes
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const codes = await ShortCode.find({ member: session.user.id, isDeleted: { $ne: true } })
    .populate("category", "name type amount")
    .sort({ createdAt: -1 })
    .limit(20);

  return NextResponse.json(codes);
}

// Delete a used or expired short code
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Code ID is required" }, { status: 400 });
  }

  const shortCode = await ShortCode.findOne({ _id: id, member: session.user.id });
  if (!shortCode) {
    return NextResponse.json({ error: "Short code not found" }, { status: 404 });
  }

  shortCode.isDeleted = true;
  await shortCode.save();
  return NextResponse.json({ message: "Short code deleted" });
}
