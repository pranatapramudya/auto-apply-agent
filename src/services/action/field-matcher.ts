export type StandardFieldType =
  | 'FULL_NAME'
  | 'FIRST_NAME'
  | 'LAST_NAME'
  | 'EMAIL'
  | 'PHONE'
  | 'CITY'
  | 'LINKEDIN'
  | 'GITHUB'
  | 'PORTFOLIO'
  | 'EXPECTED_SALARY'
  | 'RESUME'
  | 'HONEYPOT_TRAP'
  | 'UNKNOWN';

export interface FieldElementInfo {
  tag: string;
  type?: string;
  name?: string;
  id?: string;
  placeholder?: string;
  ariaLabel?: string;
  labelText?: string;
  autocomplete?: string;
  tabindex?: string;
  isOffscreen?: boolean;
  computedDisplay?: string;
  computedVisibility?: string;
  computedOpacity?: string;
  width?: number;
  height?: number;
  role?: string;
}

export interface UserFieldData {
  fullName: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  linkedInUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  expectedSalary?: number | null;
  resumeLocalPath: string;
}

/**
 * Honeypot Trap Detection:
 * Mendeteksi jebakan form yang sengaja disisipkan oleh ATS / web anti-bot
 * untuk menangkap bot otomatis (hidden elements, zero-opacity, offscreen, trap labels).
 */
export function isHoneypotField(field: FieldElementInfo): boolean {
  // 1. Cek style tersembunyi & offscreen
  if (field.computedDisplay === 'none' || field.computedVisibility === 'hidden') {
    return true;
  }
  if (field.computedOpacity === '0' || field.computedOpacity === '0.0') {
    return true;
  }
  if (field.isOffscreen) {
    return true;
  }
  if (typeof field.width === 'number' && typeof field.height === 'number') {
    if (field.width <= 1 && field.height <= 1) {
      return true;
    }
  }

  // 2. Cek nama & ID field jebakan
  const nameIdString = `${field.name || ''} ${field.id || ''}`.toLowerCase();
  const trapNameRegex = /\b(honeypot|honey_pot|hp_field|hp_trap|catch_bot|bot_trap|nobot|confirm_email_dummy|website_catch|fake_input|decoy)\b/i;
  if (trapNameRegex.test(nameIdString)) {
    return true;
  }

  // 3. Cek instruksi jebakan pada label / placeholder (e.g. "Leave this field empty / blank")
  const labelText = `${field.labelText || ''} ${field.placeholder || ''} ${field.ariaLabel || ''}`.toLowerCase();
  const trapInstructionRegex = /(leave (this )?field (blank|empty)|do not fill|if you are human.*leave.*blank|jangan diisi)/i;
  if (trapInstructionRegex.test(labelText)) {
    return true;
  }

  return false;
}

/**
 * Mendeteksi tipe field secara deterministik berdasarkan atribut HTML dan label
 */
export function identifyFieldType(field: FieldElementInfo): StandardFieldType {
  // Cek jika field merupakan honeypot trap
  if (isHoneypotField(field)) {
    return 'HONEYPOT_TRAP';
  }

  const combined = `${field.name || ''} ${field.id || ''} ${field.placeholder || ''} ${field.ariaLabel || ''} ${field.labelText || ''} ${field.autocomplete || ''}`.toLowerCase();

  // 1. File Upload / Resume
  if (field.type === 'file' || /(resume|cv|curriculum\s*vitae|lampiran|berkas)/i.test(combined)) {
    return 'RESUME';
  }

  // 2. Email
  if (field.type === 'email' || /\b(email|e-mail|surel)\b/i.test(combined)) {
    return 'EMAIL';
  }

  // 3. Phone / WhatsApp
  if (field.type === 'tel' || /(phone|telephone|mobile|whatsapp|no\.?\s*hp|nomor\s*telepon)/i.test(combined)) {
    return 'PHONE';
  }

  // 4. Social & Portfolio URLs
  if (/(linkedin|linked\s*in)/i.test(combined)) {
    return 'LINKEDIN';
  }

  if (/(github|git\s*hub)/i.test(combined)) {
    return 'GITHUB';
  }

  if (/(portfolio|portofolio|website|web\s*site|personal\s*url)/i.test(combined)) {
    return 'PORTFOLIO';
  }

  // 5. Nama
  if (/(first\s*name|nama\s*depan|given\s*name)/i.test(combined)) {
    return 'FIRST_NAME';
  }

  if (/(last\s*name|nama\s*belakang|family\s*name|surname)/i.test(combined)) {
    return 'LAST_NAME';
  }

  if (/(full\s*name|nama\s*lengkap|candidate\s*name|your\s*name|\bname\b)/i.test(combined)) {
    return 'FULL_NAME';
  }

  // 6. Lokasi / Kota
  if (/(city|kota|domisili|location|lokasi|address|alamat)/i.test(combined)) {
    return 'CITY';
  }

  // 7. Gaji / Expected Salary
  if (/(salary|gaji|compensation|remuneration|expected\s*salary)/i.test(combined)) {
    return 'EXPECTED_SALARY';
  }

  return 'UNKNOWN';
}

/**
 * Mengambil nilai deterministik dari profil user untuk tipe field yang sudah teridentifikasi
 */
export function getStandardFieldValue(type: StandardFieldType, user: UserFieldData): string | null {
  switch (type) {
    case 'FULL_NAME':
      return user.fullName;
    case 'FIRST_NAME':
      return user.fullName.split(' ')[0] || user.fullName;
    case 'LAST_NAME':
      return user.fullName.split(' ').slice(1).join(' ') || user.fullName;
    case 'EMAIL':
      return user.email;
    case 'PHONE':
      return user.phone || '+6281234567890';
    case 'CITY':
      return user.city || 'Jakarta';
    case 'LINKEDIN':
      return user.linkedInUrl || 'https://linkedin.com';
    case 'GITHUB':
      return user.githubUrl || 'https://github.com';
    case 'PORTFOLIO':
      return user.portfolioUrl || 'https://portfolio.dev';
    case 'EXPECTED_SALARY':
      return user.expectedSalary ? user.expectedSalary.toString() : '20000000';
    case 'RESUME':
      return user.resumeLocalPath;
    case 'HONEYPOT_TRAP':
    default:
      return null;
  }
}

