import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'deliveries@everlensweddings.com';

interface SendDownloadReadyEmailParams {
  to: string;
  coupleNames: string;
  downloadUrl: string;
  expiresAt: Date;
  itemCount: number;
}

/**
 * Sends a transactional notification email to the client when their full collection ZIP is ready.
 * Powered by Resend, with graceful local simulation fallback if RESEND_API_KEY is not configured.
 */
export async function sendDownloadReadyEmail({
  to,
  coupleNames,
  downloadUrl,
  expiresAt,
  itemCount,
}: SendDownloadReadyEmailParams): Promise<{ success: boolean; id?: string; simulated?: boolean }> {
  const formattedExpiry = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(expiresAt);

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Your EverLens Wedding Collection Download</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #16211D;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF7F2; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="600" style="max-width: 600px; background-color: #FAF7F2; border: 1px solid rgba(22, 33, 29, 0.15); padding: 40px; border-radius: 2px;">
          <!-- Header Logo Lockup -->
          <tr>
            <td align="center" style="padding-bottom: 24px; border-bottom: 1px solid rgba(22, 33, 29, 0.1);">
              <div style="font-size: 18px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: #16211D;">
                EverLens <span style="color: #168B8D;">Weddings</span>
              </div>
              <div style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(22, 33, 29, 0.5); margin-top: 4px;">
                Archival Delivery Service
              </div>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding-top: 32px; padding-bottom: 28px;">
              <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: normal; color: #16211D; margin: 0 0 16px 0; line-height: 1.3;">
                Your Master Archive is Ready
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: rgba(22, 33, 29, 0.8); margin: 0 0 16px 0;">
                Dear ${coupleNames},
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: rgba(22, 33, 29, 0.8); margin: 0 0 24px 0;">
                Your complete full-resolution wedding collection of <strong>${itemCount} master files</strong> has been assembled into an archival ZIP package and is ready for download.
              </p>

              <!-- Action Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center" style="border-radius: 2px; background-color: #168B8D;">
                    <a href="${downloadUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 13px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #FAF7F2; text-decoration: none; border-radius: 2px;">
                      Download Full Album (ZIP)
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <div style="background-color: #F4ECE1; border-left: 3px solid #B8654A; padding: 14px 18px; margin-top: 24px; font-size: 12px; line-height: 1.5; color: rgba(22, 33, 29, 0.85);">
                <strong>Important Expiration Notice:</strong> This direct download link is securely signed and will remain active for <strong>48 hours</strong> (expires on ${formattedExpiry}). We recommend downloading over a high-speed connection.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 24px; border-top: 1px solid rgba(22, 33, 29, 0.1); font-size: 11px; color: rgba(22, 33, 29, 0.5); text-align: center; line-height: 1.5;">
              EverLens Wedding Photography & Cinematography<br>
              This is an automated delivery notification. If you require assistance, reply to this email or contact our studio.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  if (!RESEND_API_KEY) {
    console.log(`\n======================================================`);
    console.log(`[EMAIL SIMULATION] (RESEND_API_KEY not configured)`);
    console.log(`To: ${to}`);
    console.log(`Subject: Your EverLens Wedding Collection Download is Ready`);
    console.log(`Couple: ${coupleNames}`);
    console.log(`Items: ${itemCount} files`);
    console.log(`Download Link: ${downloadUrl}`);
    console.log(`Expires: ${formattedExpiry}`);
    console.log(`======================================================\n`);
    return { success: true, simulated: true };
  }

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Your EverLens Wedding Archive Download is Ready (${coupleNames})`,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend email error:', error);
      return { success: false };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('Failed to send transactional download email:', err);
    return { success: false };
  }
}

export interface SendGalleryExpirationWarningParams {
  to: string;
  coupleNames: string;
  weddingDate?: Date;
  expirationDate: Date;
  daysRemaining: 7 | 1;
  portalUrl?: string;
}

/**
 * Sends a transactional reminder email to the client 7 days or 1 day before their gallery expires.
 * Powered by Resend, with graceful local simulation fallback if RESEND_API_KEY is not configured.
 */
export async function sendGalleryExpirationWarningEmail({
  to,
  coupleNames,
  weddingDate,
  expirationDate,
  daysRemaining,
  portalUrl = 'https://everlensweddings.com/portal',
}: SendGalleryExpirationWarningParams): Promise<{ success: boolean; id?: string; simulated?: boolean }> {
  const formattedExpiry = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
  }).format(expirationDate);

  const urgencySubject =
    daysRemaining === 1
      ? `Final Notice: Your EverLens Wedding Gallery Archives Tomorrow (${coupleNames})`
      : `Important: 7 Days Remaining to Access Your Wedding Gallery (${coupleNames})`;

  const messageLead =
    daysRemaining === 1
      ? `Your online wedding sanctuary is scheduled to archive <strong>tomorrow, ${formattedExpiry}</strong>.`
      : `Your online wedding sanctuary will reach its scheduled delivery expiration date on <strong>${formattedExpiry}</strong> (in 7 days).`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${urgencySubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #16211D;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF7F2; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="600" style="max-width: 600px; background-color: #FAF7F2; border: 1px solid rgba(22, 33, 29, 0.15); padding: 40px; border-radius: 2px;">
          <!-- Header Logo Lockup -->
          <tr>
            <td align="center" style="padding-bottom: 24px; border-bottom: 1px solid rgba(22, 33, 29, 0.1);">
              <div style="font-size: 18px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: #16211D;">
                EverLens <span style="color: #168B8D;">Weddings</span>
              </div>
              <div style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(22, 33, 29, 0.5); margin-top: 4px;">
                Client Delivery Sanctuary
              </div>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding-top: 32px; padding-bottom: 28px;">
              <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: normal; color: #16211D; margin: 0 0 16px 0; line-height: 1.3;">
                ${daysRemaining === 1 ? 'Final Notice Before Archive' : 'Gallery Expiration Notice'}
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: rgba(22, 33, 29, 0.85); margin: 0 0 16px 0;">
                Dear ${coupleNames},
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: rgba(22, 33, 29, 0.85); margin: 0 0 20px 0;">
                ${messageLead}
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: rgba(22, 33, 29, 0.85); margin: 0 0 24px 0;">
                Please ensure you have visited your sanctuary to download your high-resolution master collection (via the full album ZIP request) and finalized your 50-photo archival print selection. After this date, online portal access will close and master files will remain safely archived in studio storage.
              </p>

              <!-- Action Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center" style="border-radius: 2px; background-color: #168B8D;">
                    <a href="${portalUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 13px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #FAF7F2; text-decoration: none; border-radius: 2px;">
                      Open Client Sanctuary
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Preservation Reassurance Box -->
              <div style="background-color: #F4ECE1; border-left: 3px solid ${daysRemaining === 1 ? '#B8654A' : '#168B8D'}; padding: 14px 18px; margin-top: 24px; font-size: 12px; line-height: 1.5; color: rgba(22, 33, 29, 0.85);">
                <strong>Preservation Policy:</strong> We never delete your wedding photographs or films. If you need to extend your online access or require archival retrieval at any point in the future, simply contact our studio.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 24px; border-top: 1px solid rgba(22, 33, 29, 0.1); font-size: 11px; color: rgba(22, 33, 29, 0.5); text-align: center; line-height: 1.5;">
              EverLens Wedding Photography & Cinematography<br>
              Questions or need assistance? Reply directly to this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  if (!RESEND_API_KEY) {
    console.log(`\n======================================================`);
    console.log(`[EMAIL SIMULATION] (RESEND_API_KEY not configured)`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${urgencySubject}`);
    console.log(`Couple: ${coupleNames}`);
    console.log(`Days Remaining: ${daysRemaining}`);
    console.log(`Expiration Date: ${formattedExpiry}`);
    console.log(`Portal Link: ${portalUrl}`);
    console.log(`======================================================\n`);
    return { success: true, simulated: true };
  }

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: urgencySubject,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend email error:', error);
      return { success: false };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('Failed to send transactional gallery expiration email:', err);
    return { success: false };
  }
}

export interface SendStudioInquiryNotificationParams {
  coupleNames: string;
  email: string;
  phone?: string;
  eventDate?: string;
  venue?: string;
  packageInterest?: string;
  mediaType?: string;
  guestCount?: string;
  notes?: string;
  submittedAt?: Date;
}

const STUDIO_EMAIL = process.env.STUDIO_NOTIFICATION_EMAIL || 'everlensweddings@gmail.com';

/**
 * Sends a notification email to the studio when a new wedding inquiry is submitted.
 * Powered by Resend, with graceful local simulation fallback if RESEND_API_KEY is not configured.
 */
export async function sendStudioInquiryNotificationEmail({
  coupleNames,
  email,
  phone,
  eventDate,
  venue,
  packageInterest,
  mediaType,
  guestCount,
  notes,
  submittedAt = new Date(),
}: SendStudioInquiryNotificationParams): Promise<{ success: boolean; id?: string; simulated?: boolean }> {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(submittedAt);

  const subject = `New Wedding Inquiry: ${coupleNames} (${eventDate || 'Date TBD'})`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #16211D;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF7F2; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="600" style="max-width: 600px; background-color: #FAF7F2; border: 1px solid rgba(22, 33, 29, 0.15); padding: 40px; border-radius: 2px;">
          <!-- Header Logo Lockup -->
          <tr>
            <td align="center" style="padding-bottom: 24px; border-bottom: 1px solid rgba(22, 33, 29, 0.1);">
              <div style="font-size: 18px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: #16211D;">
                EverLens <span style="color: #168B8D;">Weddings</span>
              </div>
              <div style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(22, 33, 29, 0.5); margin-top: 4px;">
                Studio Lead Dispatch
              </div>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding-top: 32px; padding-bottom: 24px;">
              <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: normal; color: #16211D; margin: 0 0 8px 0; line-height: 1.3;">
                New Wedding Inquiry
              </h1>
              <p style="font-size: 12px; color: rgba(22, 33, 29, 0.5); margin: 0 0 24px 0;">
                Received on ${formattedDate}
              </p>

              <!-- Inquiry Summary Table -->
              <table role="presentation" width="100%" cellpadding="8" cellspacing="0" style="border: 1px solid rgba(22, 33, 29, 0.12); background-color: #FDFCFA; font-size: 13px; line-height: 1.6; margin-bottom: 24px;">
                <tr style="border-bottom: 1px solid rgba(22, 33, 29, 0.08);">
                  <td width="35%" style="font-weight: 600; color: rgba(22, 33, 29, 0.6); padding: 10px 14px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Couple</td>
                  <td style="color: #16211D; font-weight: 600; padding: 10px 14px;">${coupleNames}</td>
                </tr>
                <tr style="border-bottom: 1px solid rgba(22, 33, 29, 0.08); background-color: #F8F5EE;">
                  <td style="font-weight: 600; color: rgba(22, 33, 29, 0.6); padding: 10px 14px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Email</td>
                  <td style="color: #168B8D; padding: 10px 14px;"><a href="mailto:${email}" style="color: #168B8D; text-decoration: none;">${email}</a></td>
                </tr>
                <tr style="border-bottom: 1px solid rgba(22, 33, 29, 0.08);">
                  <td style="font-weight: 600; color: rgba(22, 33, 29, 0.6); padding: 10px 14px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Phone</td>
                  <td style="color: #16211D; padding: 10px 14px;"><a href="tel:${phone || ''}" style="color: #16211D; text-decoration: none;">${phone || 'Not provided'}</a></td>
                </tr>
                <tr style="border-bottom: 1px solid rgba(22, 33, 29, 0.08); background-color: #F8F5EE;">
                  <td style="font-weight: 600; color: rgba(22, 33, 29, 0.6); padding: 10px 14px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Event Date</td>
                  <td style="color: #16211D; padding: 10px 14px;">${eventDate || 'Not specified'}</td>
                </tr>
                <tr style="border-bottom: 1px solid rgba(22, 33, 29, 0.08);">
                  <td style="font-weight: 600; color: rgba(22, 33, 29, 0.6); padding: 10px 14px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Venue / Location</td>
                  <td style="color: #16211D; padding: 10px 14px;">${venue || 'Not specified'}</td>
                </tr>
                <tr style="border-bottom: 1px solid rgba(22, 33, 29, 0.08); background-color: #F8F5EE;">
                  <td style="font-weight: 600; color: rgba(22, 33, 29, 0.6); padding: 10px 14px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Package Interest</td>
                  <td style="color: #16211D; padding: 10px 14px;">${packageInterest || 'Not specified'}</td>
                </tr>
                <tr style="border-bottom: 1px solid rgba(22, 33, 29, 0.08);">
                  <td style="font-weight: 600; color: rgba(22, 33, 29, 0.6); padding: 10px 14px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Coverage</td>
                  <td style="color: #16211D; padding: 10px 14px;">${mediaType || 'Not specified'}</td>
                </tr>
                <tr>
                  <td style="font-weight: 600; color: rgba(22, 33, 29, 0.6); padding: 10px 14px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Guest Count</td>
                  <td style="color: #16211D; padding: 10px 14px;">${guestCount || 'Not specified'}</td>
                </tr>
              </table>

              <!-- Notes & Vision -->
              ${
                notes
                  ? `
              <div style="background-color: #F4ECE1; border-left: 3px solid #168B8D; padding: 16px 18px; margin-top: 16px; font-size: 13px; line-height: 1.6; color: rgba(22, 33, 29, 0.9);">
                <strong style="display: block; margin-bottom: 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #168B8D;">Couple's Notes & Vision:</strong>
                ${notes.replace(/\n/g, '<br>')}
              </div>
              `
                  : ''
              }

              <!-- Direct Reply Action Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px 0 0 0;">
                <tr>
                  <td align="center" style="border-radius: 2px; background-color: #168B8D;">
                    <a href="mailto:${email}?subject=EverLens%20Weddings%20Availability%20for%20${encodeURIComponent(coupleNames)}" style="display: inline-block; padding: 12px 24px; font-size: 12px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #FAF7F2; text-decoration: none; border-radius: 2px;">
                      Reply to ${coupleNames}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 24px; border-top: 1px solid rgba(22, 33, 29, 0.1); font-size: 11px; color: rgba(22, 33, 29, 0.5); text-align: center; line-height: 1.5;">
              EverLens Wedding Photography & Cinematography Lead Management<br>
              This lead was persisted in the studio database.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  if (!RESEND_API_KEY) {
    console.log(`\n======================================================`);
    console.log(`[EMAIL SIMULATION] (RESEND_API_KEY not configured)`);
    console.log(`To: ${STUDIO_EMAIL}`);
    console.log(`Subject: ${subject}`);
    console.log(`Couple: ${coupleNames} <${email}>`);
    console.log(`Phone: ${phone || 'Not provided'}`);
    console.log(`Date: ${eventDate || 'Not specified'}`);
    console.log(`Venue: ${venue || 'Not specified'}`);
    console.log(`Package: ${packageInterest || 'Not specified'}`);
    console.log(`Coverage: ${mediaType || 'Not specified'}`);
    console.log(`Guests: ${guestCount || 'Not specified'}`);
    console.log(`Notes: ${notes || 'None'}`);
    console.log(`======================================================\n`);
    return { success: true, simulated: true };
  }

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: STUDIO_EMAIL,
      replyTo: email,
      subject,
      html: htmlContent,
    });


    if (error) {
      console.error('Resend email error:', error);
      return { success: false };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('Failed to send studio inquiry notification email:', err);
    return { success: false };
  }
}

