import { logger } from '../utils/logger.ts';

type Email = { to: string; subject: string; text: string };

// The only place that knows how email is delivered. For now it prints the
// email to the server log; Step 1.23 swaps the body for a real provider.
export async function sendEmail({ to, subject, text }: Email) {
  logger.info(`[dev email] To: ${to} | Subject: ${subject}\n${text}\n[end email]`);
}
