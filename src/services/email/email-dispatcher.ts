import { config } from "../../config/env";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { EmailDispatchParams, EmailDispatchResult } from "./types";

/**
 * Konversi teks biasa (plain text) menjadi HTML yang terformat rapi untuk email
 */
function formatEmailHtml(text: string, candidateName: string): string {
  const paragraphs = text
    .split(/\n\n+/)
    .map(
      (p) =>
        `<p style="margin: 0 0 16px 0; line-height: 1.6; color: #1e293b;">${p.replace(/\n/g, "<br/>")}</p>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Surat Lamaran Pekerjaan</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #0f172a;">
  <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
    ${paragraphs}
    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #64748b;">
      <p style="margin: 0;"><em>Lampiran: Curriculum Vitae (PDF) - ${candidateName}</em></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Mesin Pengirim Email Lamaran Otomatis (Direct HRD Dispatcher)
 * Mendukung Mode Simulasi (Dry-Run / Preview) dan Mode Kirim Asli (Live Send)
 */
export async function dispatchApplicationEmail(
  params: EmailDispatchParams,
): Promise<EmailDispatchResult> {
  const sentAt = new Date().toISOString();
  const isDryRun = params.isDryRun ?? true;

  // 1. Verifikasi keberadaan file lampiran CV PDF
  const resolvedPdfPath = path.resolve(process.cwd(), params.resumePdfPath);
  const pdfExists = fs.existsSync(resolvedPdfPath);
  if (!pdfExists) {
    console.warn(
      `[EMAIL-DISPATCHER] Peringatan: File CV PDF tidak ditemukan di ${resolvedPdfPath}`,
    );
  }

  // 2. Jika Mode Simulasi (Dry-Run)
  if (isDryRun) {
    console.log("\n========================================================");
    console.log("🛡️ [EMAIL DISPATCHER - MODE SIMULASI (DRY-RUN)]");
    console.log(`Penerima  : ${params.toEmail}`);
    console.log(`Subjek    : ${params.subject}`);
    console.log(
      `Kandidat  : ${params.candidateName} <${params.candidateEmail}>`,
    );
    console.log(`Perusahaan: ${params.companyName || "-"}`);
    console.log(
      `Lampiran  : ${pdfExists ? path.basename(resolvedPdfPath) : "File PDF tidak ditemukan"}`,
    );
    console.log("--------------------------------------------------------");
    console.log("Isi Surat Lamaran:");
    console.log(params.bodyText);
    console.log("========================================================\n");

    return {
      success: true,
      mode: "DRY_RUN",
      to: params.toEmail,
      subject: params.subject,
      sentAt,
      messageId: `simulated-${Date.now()}`,
    };
  }

  // 3. Mode Pengiriman Asli (Live Send) via SMTP
  const smtpHost = config.smtp.host;
  const smtpUser = config.smtp.user;
  const smtpPass = config.smtp.pass;
  const smtpPort = Number(config.smtp.port) || 587;
  const smtpSecure = config.smtp.secure;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error(
      "Kredensial SMTP belum lengkap di file .env (Membutuhkan SMTP_HOST, SMTP_USER, SMTP_PASS). Gunakan Mode Simulasi (Dry-Run) atau lengkapi .env terlebih dahulu.",
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const attachments = [];
  if (pdfExists) {
    attachments.push({
      filename: path.basename(resolvedPdfPath),
      path: resolvedPdfPath,
      contentType: "application/pdf",
    });
  }

  const htmlContent =
    params.bodyHtml || formatEmailHtml(params.bodyText, params.candidateName);

  const mailOptions = {
    from: `"${params.candidateName}" <${smtpUser}>`,
    replyTo: params.candidateEmail,
    to: params.toEmail,
    subject: params.subject,
    text: params.bodyText,
    html: htmlContent,
    attachments,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(
    `[EMAIL-DISPATCHER] Email sukses terkirim ke ${params.toEmail}. Message ID: ${info.messageId}`,
  );

  return {
    success: true,
    mode: "LIVE_SEND",
    messageId: info.messageId,
    to: params.toEmail,
    subject: params.subject,
    sentAt,
  };
}
