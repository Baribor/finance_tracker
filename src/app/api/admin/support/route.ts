import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import SupportTicket from "@/models/SupportTicket";
import { authOptions } from "@/lib/auth";

// Admin only — list all support tickets
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const tickets = await SupportTicket.find()
    .sort({ updatedAt: -1 });

  return NextResponse.json(tickets);
}

// Admin — reply to a ticket or close it
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const body = await req.json();
  const { ticketId, message, action } = body;

  if (!ticketId) {
    return NextResponse.json(
      { error: "Ticket ID is required" },
      { status: 400 }
    );
  }

  const ticket = await SupportTicket.findOne({ ticketId });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  if (action === "close") {
    ticket.status = "closed";
    await ticket.save();
    return NextResponse.json(ticket);
  }

  if (!message) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );
  }

  ticket.messages.push({
    sender: session.user.name || "Admin",
    senderRole: "admin",
    content: message.trim(),
    createdAt: new Date(),
  });

  // Reopen if it was closed
  if (ticket.status === "closed") {
    ticket.status = "open";
  }

  await ticket.save();
  return NextResponse.json(ticket);
}
