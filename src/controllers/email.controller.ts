import { Request, Response } from 'express';
import { sendMail } from '../utils/mailer';
import {
  contactTemplate,
  talentsTemplate,
  newsletterTemplate,
  autoresponderContactTemplate,
  autoresponderTalentsTemplate,
  autoresponderNewsletterTemplate,
} from '../utils/email-templates';

function isValidEmail(email: string) {
  const basic = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const endsWithValidTld = /\.(com|br)$/i.test(email);
  return basic && endsWithValidTld;
}

function normalizePhone(phone?: string) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

function isValidPhone(phone?: string) {
  if (!phone) return true; // opcional
  const digits = normalizePhone(phone);
  // valida formatos BR comuns: 10 ou 11 dígitos (com ou sem DDI)
  return digits.length >= 10 && digits.length <= 13;
}

export class EmailController {
  static async contact(req: Request, res: Response) {
    try {
      const { name, email, phone, company, regime, employees, message } = req.body || {};
      if (!name || !email) return res.status(400).json({ success: false, message: 'Nome e e-mail são obrigatórios.' });

      const to = process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER;
      if (!to) return res.status(500).json({ success: false, message: 'Destinatário não configurado.' });

      if (!isValidEmail(email)) return res.status(400).json({ success: false, message: 'E-mail inválido.' });
      if (!isValidPhone(phone)) return res.status(400).json({ success: false, message: 'Telefone inválido.' });

      await sendMail({
        to,
        subject: 'Novo contato pelo site - OCC',
        html: contactTemplate({ name, email, phone, company, regime, employees, message }),
        replyTo: email,
      });

      if (process.env.SEND_AUTORESPONDER !== 'false') {
        await sendMail({
          to: email,
          subject: 'Recebemos sua mensagem - OCC',
          html: autoresponderContactTemplate(name),
        });
      }
      return res.json({ success: true, data: { ok: true } });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error?.message || 'Erro ao enviar e-mail' });
    }
  }

  static async talents(req: Request, res: Response) {
    try {
      const { name, email, phone, sector, experience, message } = req.body || {};
      if (!name || !email) return res.status(400).json({ success: false, message: 'Nome e e-mail são obrigatórios.' });

      const to = process.env.TALENTS_TO_EMAIL || process.env.SMTP_USER;
      if (!to) return res.status(500).json({ success: false, message: 'Destinatário não configurado.' });

      if (!isValidEmail(email)) return res.status(400).json({ success: false, message: 'E-mail inválido.' });
      if (!isValidPhone(phone)) return res.status(400).json({ success: false, message: 'Telefone inválido.' });

      // Anexo opcional: currículo em PDF
      const file = (req as any).file as Express.Multer.File | undefined;
      let attachments: Array<{ filename: string; content: Buffer; contentType?: string }> | undefined;
      if (file) {
        if (file.mimetype !== 'application/pdf') {
          return res.status(400).json({ success: false, message: 'O currículo deve ser um PDF.' });
        }
        attachments = [{ filename: file.originalname || 'curriculo.pdf', content: file.buffer, contentType: file.mimetype }];
      }

      await sendMail({
        to,
        subject: 'Nova candidatura - OCC',
        html: talentsTemplate({ name, email, phone, sector, experience, message }),
        replyTo: email,
        attachments,
      });

      if (process.env.SEND_AUTORESPONDER !== 'false') {
        await sendMail({
          to: email,
          subject: 'Candidatura recebida - OCC',
          html: autoresponderTalentsTemplate(name),
        });
      }
      return res.json({ success: true, data: { ok: true } });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error?.message || 'Erro ao enviar e-mail' });
    }
  }

  static async newsletter(req: Request, res: Response) {
    try {
      const { email } = req.body || {};
      if (!email) return res.status(400).json({ success: false, message: 'E-mail é obrigatório.' });

      const to = process.env.NEWSLETTER_TO_EMAIL || process.env.SMTP_USER;
      if (!to) return res.status(500).json({ success: false, message: 'Destinatário não configurado.' });

      if (!isValidEmail(email)) return res.status(400).json({ success: false, message: 'E-mail inválido.' });

      await sendMail({
        to,
        subject: 'Nova inscrição na newsletter - OCC',
        html: newsletterTemplate(email),
        replyTo: email,
      });

      if (process.env.SEND_AUTORESPONDER !== 'false') {
        await sendMail({
          to: email,
          subject: 'Inscrição confirmada - OCC',
          html: autoresponderNewsletterTemplate(),
        });
      }
      return res.json({ success: true, data: { ok: true } });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error?.message || 'Erro ao enviar e-mail' });
    }
  }
}


