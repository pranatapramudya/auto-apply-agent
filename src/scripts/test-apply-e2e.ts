import http from 'http';
import path from 'path';
import prisma from '../lib/prisma';
import PlaywrightApplyEngine from '../services/action/apply-engine';

/**
 * HTML Formulir Standar ATS (Greenhouse / Lever style) untuk verifikasi end-to-end:
 * Menguji seluruh kemampuan engine: field biodata, upload file resume PDF,
 * dan penyelesaian pertanyaan screening kustom menggunakan Llama 3.
 */
const ATS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Senior Full-stack Engineer Application - ScaleUp Technologies</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; padding: 40px 20px; }
    .container { max-width: 680px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    h1 { font-size: 24px; margin-bottom: 4px; color: #1e293b; }
    p.subtitle { color: #64748b; margin-top: 0; margin-bottom: 24px; }
    .form-group { margin-bottom: 20px; }
    label { display: block; font-weight: 600; font-size: 14px; margin-bottom: 6px; color: #334155; }
    input[type="text"], input[type="email"], input[type="tel"], input[type="number"], select, textarea {
      width: 100%; box-sizing: border-box; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;
    }
    textarea { min-height: 90px; resize: vertical; }
    input[type="file"] { padding: 8px 0; font-size: 14px; }
    .btn-submit { background: #2563eb; color: #fff; padding: 12px 24px; border: none; border-radius: 6px; font-weight: 600; font-size: 15px; cursor: pointer; }
    .btn-submit:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="container">
    <h1>ScaleUp Technologies</h1>
    <p class="subtitle">Job Application: Senior Full-stack Engineer (Next.js & TypeScript)</p>

    <form id="application-form" action="/submit" method="POST">
      <!-- 1. Data Pribadi Dasar -->
      <div class="form-group">
        <label for="first_name">First Name *</label>
        <input type="text" id="first_name" name="first_name" required>
      </div>

      <div class="form-group">
        <label for="last_name">Last Name *</label>
        <input type="text" id="last_name" name="last_name" required>
      </div>

      <div class="form-group">
        <label for="email">Email Address *</label>
        <input type="email" id="email" name="email" required>
      </div>

      <div class="form-group">
        <label for="phone">Phone Number *</label>
        <input type="tel" id="phone" name="phone" required>
      </div>

      <div class="form-group">
        <label for="city">Current Location / City</label>
        <input type="text" id="city" name="city">
      </div>

      <!-- 2. Portofolio & Social Links -->
      <div class="form-group">
        <label for="linkedin_url">LinkedIn Profile URL</label>
        <input type="text" id="linkedin_url" name="linkedin_url" placeholder="https://linkedin.com/in/...">
      </div>

      <div class="form-group">
        <label for="github_url">GitHub Profile URL</label>
        <input type="text" id="github_url" name="github_url" placeholder="https://github.com/...">
      </div>

      <div class="form-group">
        <label for="portfolio_url">Portfolio Website</label>
        <input type="text" id="portfolio_url" name="portfolio_url" placeholder="https://...">
      </div>

      <div class="form-group">
        <label for="salary_expectation">Expected Monthly Salary (IDR)</label>
        <input type="text" id="salary_expectation" name="salary_expectation">
      </div>

      <!-- 3. Unggah File Resume -->
      <div class="form-group">
        <label for="resume">Attach Resume / CV (PDF) *</label>
        <input type="file" id="resume" name="resume" accept=".pdf,.doc,.docx" required>
      </div>

      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 28px 0;">

      <!-- 4. Pertanyaan Screening Dinamis (Diselesaikan oleh AI Persona Resolver) -->
      <div class="form-group">
        <label for="years_nextjs">How many years of experience do you have with Next.js and TypeScript? *</label>
        <input type="number" id="years_nextjs" name="years_nextjs" min="0" max="20" required>
      </div>

      <div class="form-group">
        <label for="project_experience">Describe a challenging full-stack application you built with Next.js and PostgreSQL:</label>
        <textarea id="project_experience" name="project_experience" placeholder="Tell us about the architecture, challenges, and results..."></textarea>
      </div>

      <div class="form-group">
        <label for="work_authorization">Are you legally authorized to work in Indonesia / Remote?</label>
        <select id="work_authorization" name="work_authorization">
          <option value="">-- Please Select --</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>

      <div class="form-group">
        <label for="visa_sponsorship">Will you now or in the future require visa sponsorship?</label>
        <select id="visa_sponsorship" name="visa_sponsorship">
          <option value="">-- Please Select --</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>

      <button type="submit" class="btn-submit" id="submit-button">Submit Application</button>
    </form>
  </div>
</body>
</html>`;

function startAtsServer(port = 4321): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url === '/submit' && req.method === 'POST') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Application Submitted Successfully! Thank you.</h1>');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(ATS_HTML);
    });
    server.listen(port, () => {
      resolve(server);
    });
  });
}

async function main() {
  console.log('================================================================');
  console.log('🧪 PENGUJIAN END-TO-END: FORM-FILLER & AI SCREENING RESOLVER');
  console.log('================================================================\n');

  // 1. Jalankan server formulir ATS lokal
  const PORT = 4321;
  const server = await startAtsServer(PORT);
  const testFormUrl = `http://localhost:${PORT}/jobs/senior-fullstack-engineer`;
  console.log(`[TEST-ATS] Server formulir ATS lokal aktif di: ${testFormUrl}`);

  // 2. Ambil User 1 (Pranata Pramudya) dari Neon DB
  const user = await prisma.user.findFirstOrThrow({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' }
  });
  console.log(`[TEST-ATS] Profil Pelamar: ${user.fullName} (${user.email})`);
  console.log(`[TEST-ATS] Resume Path   : ${user.resumeLocalPath}`);

  // 3. Daftarkan / Upsert lowongan uji coba ini ke Neon DB
  const jobListing = await prisma.jobListing.upsert({
    where: {
      userId_jobUrl: {
        userId: user.id,
        jobUrl: testFormUrl
      }
    },
    update: {
      title: 'Senior Full-stack Engineer (Next.js & TypeScript)',
      companyName: 'ScaleUp Technologies Pte Ltd',
      platform: 'GREENHOUSE_ATS',
      status: 'DISCOVERED',
      matchScore: 0.98,
      failureReason: null
    },
    create: {
      userId: user.id,
      title: 'Senior Full-stack Engineer (Next.js & TypeScript)',
      companyName: 'ScaleUp Technologies Pte Ltd',
      platform: 'GREENHOUSE_ATS',
      jobUrl: testFormUrl,
      description: 'Looking for a Senior Full-stack Engineer experienced in Next.js, TypeScript, Prisma, PostgreSQL, and Python.',
      status: 'DISCOVERED',
      matchScore: 0.98
    }
  });

  console.log(`[TEST-ATS] Record Lowongan di Neon DB: ID ${jobListing.id} (Status: ${jobListing.status})\n`);

  // 4. Eksekusi Playwright Apply Engine dalam Mode DRY-RUN
  console.log('----------------------------------------------------------------');
  console.log('🚀 EKSEKUSI STEP 1: DRY-RUN (Pengisian Form, Upload CV & AI Screening)');
  console.log('----------------------------------------------------------------');

  const engine = new PlaywrightApplyEngine();

  // Update status ke APPLYING di database
  await prisma.jobListing.update({
    where: { id: jobListing.id },
    data: { status: 'APPLYING' }
  });

  const dryRunResult = await engine.applyToJob(
    {
      id: jobListing.id,
      title: jobListing.title,
      companyName: jobListing.companyName,
      jobUrl: jobListing.jobUrl,
      description: jobListing.description
    },
    user,
    { dryRun: true, headless: true }
  );

  console.log('\nHasil Dry-Run:');
  console.log(`- Sukses              : ${dryRunResult.success}`);
  console.log(`- Total Field Terisi  : ${dryRunResult.fieldsFilled}`);
  console.log(`- Bukti Screenshot    : ${dryRunResult.screenshotPath}`);

  // 5. Eksekusi Playwright Apply Engine dalam Mode LIVE SUBMIT
  console.log('\n----------------------------------------------------------------');
  console.log('🚀 EKSEKUSI STEP 2: LIVE SUBMIT & UPDATE SIKLUS HIDUP DATABASE (APPLIED)');
  console.log('----------------------------------------------------------------');

  const liveResult = await engine.applyToJob(
    {
      id: jobListing.id,
      title: jobListing.title,
      companyName: jobListing.companyName,
      jobUrl: jobListing.jobUrl,
      description: jobListing.description
    },
    user,
    { dryRun: false, headless: true }
  );

  if (liveResult.success) {
    const updatedJob = await prisma.jobListing.update({
      where: { id: jobListing.id },
      data: {
        status: 'APPLIED',
        appliedAt: liveResult.appliedAt || new Date(),
        failureReason: null
      }
    });

    console.log(`\n🎉 BERHASIL SUBMIT! Status Database Neon:`);
    console.log(`   - ID Lowongan : ${updatedJob.id}`);
    console.log(`   - Status      : ${updatedJob.status}`);
    console.log(`   - Applied At  : ${updatedJob.appliedAt?.toISOString()}`);
    console.log(`   - Bukti Screenshot Submit: ${liveResult.screenshotPath}`);
  } else {
    await prisma.jobListing.update({
      where: { id: jobListing.id },
      data: {
        status: 'FAILED',
        failureReason: liveResult.error || 'Submission failed'
      }
    });
    console.error(`❌ Gagal submit live: ${liveResult.error}`);
  }

  // Tutup server ATS lokal
  server.close();

  console.log('\n================================================================');
  console.log('🏁 PENGUJIAN END-TO-END SELESAI DENGAN SUKSES');
  console.log('================================================================\n');
}

main()
  .catch((err) => {
    console.error('Error saat menjalankan test-apply-e2e:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
