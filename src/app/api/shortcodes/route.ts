import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import ShortCode from "@/models/ShortCode";
import Category from "@/models/Category";
import { authOptions } from "@/lib/auth";

// Generate a short code (member-facing)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
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

  // Generate unique 8-character code
  const code = crypto.randomBytes(4).toString("hex").toUpperCase();

  const shortCode = await ShortCode.create({
    code,
    member: session.user.id,
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
  const codes = await ShortCode.find({ member: session.user.id })
    .populate("category", "name type amount")
    .sort({ createdAt: -1 })
    .limit(20);

  return NextResponse.json(codes);
}
