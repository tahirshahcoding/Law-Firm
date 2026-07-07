/**
 * WhatsApp Click-to-Chat utility
 * Uses the official wa.me URL scheme — 100% free, no API keys needed.
 * Opens WhatsApp Web/Desktop with a pre-filled message; staff just hits Send.
 */

const FIRM_NAME = 'Rahimullah Advocate';
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://clientcounsel.vercel.app';

// ── Phone number normalizer ──────────────────────────────────────────────────

/**
 * Converts a local Pakistani number (0300…) or any format into the
 * international E.164-style digits-only string that wa.me requires.
 *
 * Examples:
 *   "0300 1234567"   → "923001234567"
 *   "+92-300-1234567" → "923001234567"
 *   "03001234567"    → "923001234567"
 */
function normalizePhone(phone: string): string {
  // Strip everything except digits and leading +
  let digits = phone.replace(/[^\d+]/g, '');

  // Remove leading + if present
  if (digits.startsWith('+')) {
    digits = digits.substring(1);
  }

  // Pakistani local number → prepend country code
  if (digits.startsWith('0')) {
    digits = '92' + digits.substring(1);
  }

  // If it doesn't start with a country code, assume Pakistan
  if (digits.length <= 10) {
    digits = '92' + digits;
  }

  return digits;
}

// ── Core sender ──────────────────────────────────────────────────────────────

/**
 * Opens WhatsApp Web / Desktop with a pre-filled message for the given number.
 * Returns true if the tab was opened, false if the phone was missing.
 */
export function sendWhatsApp(phone: string, message: string): boolean {
  if (!phone || !phone.trim()) return false;

  const normalized = normalizePhone(phone);
  const encoded = encodeURIComponent(message.trim());
  const url = `https://wa.me/${normalized}?text=${encoded}`;

  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

// ── Message Templates ────────────────────────────────────────────────────────

/**
 * Client portal credentials message.
 */
export function clientCredentialsMessage(
  clientName: string,
  username: string,
  password: string,
): string {
  return [
    `Assalam-o-Alaikum ${clientName},`,
    ``,
    `Welcome to *${FIRM_NAME}*! Your Client Portal account has been created.`,
    ``,
    `*Portal Login Credentials*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `Username: *${username}*`,
    `Password: *${password}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `Login at: ${PORTAL_URL}`,
    ``,
    `Please save these credentials securely. You can use the portal to track your case progress, view hearing dates, and access documents.`,
    ``,
    `Regards,`,
    `${FIRM_NAME}`,
  ].join('\n');
}

/**
 * Password reset / credentials updated message.
 */
export function credentialsResetMessage(
  clientName: string,
  username: string,
  password: string,
): string {
  return [
    `Assalam-o-Alaikum ${clientName},`,
    ``,
    `Your *${FIRM_NAME}* Client Portal credentials have been updated.`,
    ``,
    `*Updated Login Credentials*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `Username: *${username}*`,
    `New Password: *${password}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `Login at: ${PORTAL_URL}`,
    ``,
    `Your previous password is no longer valid. Please save these new credentials securely.`,
    ``,
    `Regards,`,
    `${FIRM_NAME}`,
  ].join('\n');
}

/**
 * Case registration notification message.
 */
export function caseRegisteredMessage(
  clientName: string,
  caseNumber: string,
  opponentName: string,
  court: string,
  judge: string,
): string {
  return [
    `Assalam-o-Alaikum ${clientName},`,
    ``,
    `Your case has been officially registered with *${FIRM_NAME}*.`,
    ``,
    `📂 *Case Details*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📋 Case No: *${caseNumber}*`,
    `⚔️ Versus: *${opponentName}*`,
    `🏛️ Court: *${court}*`,
    `👨‍⚖️ Judge: *${judge}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `Our team will keep you updated on all developments. You can also track your case on the client portal.`,
    ``,
    `Regards,`,
    `${FIRM_NAME}`,
  ].join('\n');
}

/**
 * Hearing scheduled notification message.
 */
export function hearingScheduledMessage(
  clientName: string,
  caseNumber: string,
  hearingDate: string,
  nextDate?: string,
  notes?: string,
): string {
  const lines = [
    `Assalam-o-Alaikum ${clientName},`,
    ``,
    `A hearing has been scheduled for your case.`,
    ``,
    `📅 *Hearing Details*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📋 Case No: *${caseNumber}*`,
    `📆 Hearing Date: *${hearingDate}*`,
  ];

  if (nextDate) {
    lines.push(`📆 Next Date: *${nextDate}*`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━`);

  if (notes) {
    lines.push(``, `📝 Notes: ${notes}`);
  }

  lines.push(
    ``,
    `Please ensure your availability on the hearing date. Contact us if you have any questions.`,
    ``,
    `Regards,`,
    `${FIRM_NAME}`,
  );

  return lines.join('\n');
}

/**
 * Challan / payment demand message.
 */
export function challanMessage(
  clientName: string,
  challanNumber: string,
  caseNumber: string,
  amount: number,
  dueDate: string,
  description?: string,
): string {
  return [
    `Assalam-o-Alaikum ${clientName},`,
    ``,
    `Please find your payment challan from *${FIRM_NAME}*.`,
    ``,
    `🧾 *Payment Challan*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📋 Challan No: *${challanNumber}*`,
    `📂 Case No: *${caseNumber}*`,
    `💰 Amount Due: *Rs. ${Number(amount).toLocaleString()}*`,
    `📅 Due Date: *${dueDate}*`,
    description ? `📝 For: ${description}` : '',
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `🏦 *Bank Details*`,
    `Bank: Bank of Khyber`,
    `A/C: 1029384756`,
    `IBAN: PK99 BOK 1029 3847 56`,
    ``,
    `Please make the payment before the due date. Contact us for any queries.`,
    ``,
    `Regards,`,
    `${FIRM_NAME}`,
  ].filter(Boolean).join('\n');
}
