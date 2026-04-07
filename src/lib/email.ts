import nodemailer from "nodemailer";

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true", // true for port 465, false otherwise
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM ?? "CDS Finance Tracker <noreply@cdsfinance.app>";
const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
const APP_NAME = "CDS Finance Tracker";

// ---------------------------------------------------------------------------
// Base HTML shell — inline styles for broadest email-client compatibility
// ---------------------------------------------------------------------------

function baseTemplate(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7f6;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo bar -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#0f766e;width:40px;height:40px;border-radius:10px;text-align:center;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:20px;font-weight:bold;line-height:40px;">&#8358;</span>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-size:18px;font-weight:bold;color:#134e4a;">${APP_NAME}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:12px;border:1px solid #e5e7eb;padding:36px 40px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                This is an automated message from ${APP_NAME}.<br />
                Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Template helpers
// ---------------------------------------------------------------------------

function heading(text: string) {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">${text}</h1>`;
}

function subheading(text: string) {
  return `<p style="margin:0 0 24px;font-size:15px;color:#6b7280;">${text}</p>`;
}

function paragraph(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">${text}</p>`;
}

function infoBlock(rows: [string, string][]): string {
  const cells = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:8px 12px;font-size:13px;color:#6b7280;white-space:nowrap;vertical-align:top;">${label}</td>
        <td style="padding:8px 12px;font-size:13px;color:#111827;font-weight:600;word-break:break-word;">${value}</td>
      </tr>`
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"
    style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px;">
    <tbody>${cells}</tbody>
  </table>`;
}

function ctaButton(label: string, url: string, color = "#0f766e"): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="border-radius:8px;background-color:${color};">
        <a href="${url}" target="_blank"
          style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;
                 color:#ffffff;text-decoration:none;border-radius:8px;line-height:1;"
        >${label}</a>
      </td>
    </tr>
  </table>`;
}

function divider() {
  return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />`;
}

// ---------------------------------------------------------------------------
// Email: Approval
// ---------------------------------------------------------------------------

export async function sendApprovalEmail(opts: {
  to: string;
  secretaryName: string;
  groupName: string;
  stateCode: string;
}) {
  const loginUrl = `${APP_URL}/login`;

  const html = baseTemplate(
    "Your CDS group has been approved",
    `
    ${heading("Your registration has been approved")}
    ${subheading("Welcome to CDS Finance Tracker")}

    ${paragraph(`Hello ${opts.secretaryName},`)}
    ${paragraph(
      `We are pleased to inform you that your CDS group registration request has been reviewed and <strong style="color:#0f766e;">approved</strong>.
       Your group and secretary account are now active.`
    )}

    ${infoBlock([
      ["CDS Group", opts.groupName],
      ["State Code (Login ID)", opts.stateCode],
      ["Default Password", opts.stateCode],
    ])}

    ${paragraph(
      `Use your state code as both your login ID and your initial password.
       You will be prompted to set a new password the first time you sign in.`
    )}

    ${ctaButton("Sign In to Your Dashboard", loginUrl)}

    ${divider()}

    ${paragraph(
      `<span style="font-size:13px;color:#6b7280;">
        Keep your credentials secure. If you did not submit this registration request, please contact us immediately.
      </span>`
    )}
  `
  );

  const text = `Hello ${opts.secretaryName},

Your CDS group registration request has been approved.

Group: ${opts.groupName}
Login ID (State Code): ${opts.stateCode}
Default Password: ${opts.stateCode}

Sign in at: ${loginUrl}

You will be required to change your password on first login. Keep your credentials secure.

— ${APP_NAME}`;

  await transport.sendMail({
    from: FROM,
    to: opts.to,
    subject: `Your CDS group "${opts.groupName}" has been approved`,
    text,
    html,
  });
}

// ---------------------------------------------------------------------------
// Email: Rejection
// ---------------------------------------------------------------------------

export async function sendRejectionEmail(opts: {
  to: string;
  secretaryName: string;
  groupName: string;
  reason?: string;
}) {
  const signupUrl = `${APP_URL}/signup`;

  const html = baseTemplate(
    "Your CDS group registration was not approved",
    `
    ${heading("Registration request not approved")}
    ${subheading("Thank you for your interest in CDS Finance Tracker")}

    ${paragraph(`Hello ${opts.secretaryName},`)}
    ${paragraph(
      `Thank you for submitting a registration request for <strong>${opts.groupName}</strong>.
       After review, we were unable to approve your request at this time.`
    )}

    ${
      opts.reason
        ? infoBlock([["Reason", opts.reason]])
        : ""
    }

    ${paragraph(
      `If you believe this is an error or would like to re-apply with updated information,
       you are welcome to submit a new request.`
    )}

    ${ctaButton("Submit a New Request", signupUrl, "#374151")}

    ${divider()}

    ${paragraph(
      `<span style="font-size:13px;color:#6b7280;">
        If you have questions about this decision, please reach out to your NYSC state coordinator.
      </span>`
    )}
  `
  );

  const text = `Hello ${opts.secretaryName},

Your registration request for "${opts.groupName}" has not been approved.

${opts.reason ? `Reason: ${opts.reason}\n\n` : ""}If you believe this is an error or would like to re-apply, you can submit a new request at: ${signupUrl}

— ${APP_NAME}`;

  await transport.sendMail({
    from: FROM,
    to: opts.to,
    subject: `Update on your CDS group registration request — ${opts.groupName}`,
    text,
    html,
  });
}

// ---------------------------------------------------------------------------
// Email: Registration Confirmation (sent when signup form is submitted)
// ---------------------------------------------------------------------------

export async function sendRegistrationConfirmationEmail(opts: {
  to: string;
  secretaryName: string;
  groupName: string;
}) {
  const html = baseTemplate(
    "Registration request received",
    `
    ${heading("We received your registration")}
    ${subheading("Your request is now pending admin review")}

    ${paragraph(`Hello ${opts.secretaryName},`)}
    ${paragraph(
      `Thank you for submitting a registration request for <strong>${opts.groupName}</strong> on ${APP_NAME}.
       Your request has been received and is now awaiting admin review.`
    )}

    ${infoBlock([
      ["CDS Group", opts.groupName],
      ["Secretary", opts.secretaryName],
      ["Status", "Pending Review"],
    ])}

    ${paragraph(
      `You will receive another email once an admin has reviewed and approved (or rejected) your request.
       No further action is needed from you at this time.`
    )}

    ${divider()}

    ${paragraph(
      `<span style="font-size:13px;color:#6b7280;">
        If you did not submit this request, you can safely ignore this email.
      </span>`
    )}
  `
  );

  const text = `Hello ${opts.secretaryName},

Thank you for submitting a registration request for "${opts.groupName}" on ${APP_NAME}.

Your request has been received and is now awaiting admin review. You will receive another email once an admin has reviewed your request.

— ${APP_NAME}`;

  await transport.sendMail({
    from: FROM,
    to: opts.to,
    subject: `Registration received — ${opts.groupName}`,
    text,
    html,
  });
}

// ---------------------------------------------------------------------------
// Email: Support Ticket Created
// ---------------------------------------------------------------------------

export async function sendTicketCreatedEmail(opts: {
  to: string;
  name: string;
  ticketId: string;
}) {
  const html = baseTemplate(
    "Support ticket created",
    `
    ${heading("Support Ticket Created")}
    ${subheading("We have received your message")}

    ${paragraph(`Hello ${opts.name},`)}
    ${paragraph(
      `Your support ticket has been created. Our team will review and respond as soon as possible.`
    )}

    ${infoBlock([
      ["Ticket ID", `<strong style="font-family:monospace;font-size:15px;letter-spacing:1px;">${opts.ticketId}</strong>`],
    ])}

    ${paragraph(
      `Save your ticket ID — you can use it anytime to check the status of your request or continue the conversation.`
    )}

    ${divider()}

    ${paragraph(
      `<span style="font-size:13px;color:#6b7280;">
        If you did not create this ticket, you can safely ignore this email.
      </span>`
    )}
  `
  );

  const text = `Hello ${opts.name},

Your support ticket has been created.

Ticket ID: ${opts.ticketId}

Save this ID — you can use it to check status or continue the conversation.

— ${APP_NAME}`;

  await transport.sendMail({
    from: FROM,
    to: opts.to,
    subject: `Support Ticket ${opts.ticketId} — ${APP_NAME}`,
    text,
    html,
  });
}
