import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SupportTicket from "@/models/SupportTicket";

// Public — get ticket by ticketId
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params;
  await dbConnect();

  const ticket = await SupportTicket.findOne({ ticketId });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  return NextResponse.json(ticket);
}

// Public — add a message to a ticket (user side)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params;
  await dbConnect();
  const body = await req.json();
  const { message, sender } = body;

  if (!message) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );
  }

  const ticket = await SupportTicket.findOne({ ticketId });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  if (ticket.status === "closed") {
    return NextResponse.json(
      { error: "This ticket has been closed" },
      { status: 400 }
    );
  }

  ticket.messages.push({
    sender: sender || ticket.name,
    senderRole: "user",
    content: message.trim(),
    createdAt: new Date(),
  });
  await ticket.save();

  return NextResponse.json(ticket);
}
