import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Category from "@/models/Category";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const filter: Record<string, unknown> = { isActive: true };
  if (session.user.group) {
    filter.group = session.user.group;
  }
  const categories = await Category.find(filter).sort({ createdAt: -1 });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const body = await req.json();
  const { name, description, amount, type } = body;

  if (!name || amount === undefined || !type) {
    return NextResponse.json(
      { error: "Name, amount, and type are required" },
      { status: 400 }
    );
  }

  const category = await Category.create({
    name: name.trim(),
    description: description?.trim() || "",
    amount: Number(amount),
    type,
    group: session.user.group || undefined,
  });

  return NextResponse.json(category, { status: 201 });
}
