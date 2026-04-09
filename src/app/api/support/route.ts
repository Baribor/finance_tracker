import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SupportTicket from "@/models/SupportTicket";
import { sendTicketCreatedEmail } from "@/lib/email";

// Public — create a new support ticket
export async function POST(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  const { name, email, subject, message } = body;

  if (!name || !email || !subject || !message) {
    return NextResponse.json(
      { error: "Name, email, subject, and message are required" },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return NextResponse.json(
      { error: "Please provide a valid email address" },
      { status: 400 }
    );
  }

  const ticket = await SupportTicket.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    subject: subject.trim(),
    messages: [
      {
        sender: name.trim(),
        senderRole: "user",
        content: message.trim(),
        createdAt: new Date(),
      },
    ],
  });

  // Send ticket ID to user's email (non-blocking)
  try {
    await sendTicketCreatedEmail({
      to: email.trim().toLowerCase(),
      name: name.trim(),
      ticketId: ticket.ticketId,
    });
  } catch {
    console.error("Failed to send ticket created email");
  }

  return NextResponse.json(
    { ticketId: ticket.ticketId, message: "Support ticket created" },
    { status: 201 }
  );
}
