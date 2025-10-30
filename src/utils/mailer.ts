import nodemailer, { Transporter } from 'nodemailer';

export interface MailParams {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer; contentType?: string }>;
}

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('Configuração SMTP ausente: defina SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return cachedTransporter;
}

export async function sendMail({ to, subject, html, text, replyTo, attachments }: MailParams) {
  const fromName = process.env.MAIL_FROM_NAME || 'OCC Site';
  const fromEmail = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER;
  if (!fromEmail) throw new Error('MAIL_FROM_EMAIL ou SMTP_USER deve estar definido');

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject,
    html,
    text,
    replyTo,
    attachments,
  });
}


