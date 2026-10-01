import { cleanHtmlDescription } from '../services/scraper/kalibrr-scraper';
import prisma from '../lib/prisma';
import { ingestRawJobs } from '../services/job-ingestion';
import { RawJobListing } from '../services/scraper/types';

async function fetchAndIngestWestJavaJobs() {
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users in DB.`);

  const searchKeywords = [
    'Sumedang',
    'Jatinangor',
    'Bandung',
    'Kota Bandung',
    'Jawa Barat'
  ];

  const candidateJobs: RawJobListing[] = [];
  const seenJobUrls = new Set<string>();

  for (const kw of searchKeywords) {
    console.log(`[KALIBRR-LIVE] Searching real-time jobs for keyword/location: "${kw}"...`);
    try {
      const url = `https://www.kalibrr.com/api/job_board/search?text=${encodeURIComponent(kw)}&country=Indonesia&limit=20&offset=0`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json'
        }
      });
      if (!res.ok) {
        console.warn(`Failed to fetch for ${kw}: ${res.status}`);
        continue;
      }
      const data: any = await res.json();
      const jobs = data.jobs || [];
      console.log(`Found ${jobs.length} jobs for "${kw}"`);

      for (const j of jobs) {
        const companyCode = j.company?.code || 'company';
        const jobUrl = `https://www.kalibrr.com/c/${companyCode}/jobs/${j.id}/${j.slug}`;
        if (seenJobUrls.has(jobUrl)) continue;
        seenJobUrls.add(jobUrl);

        let location = 'Indonesia';
        if (j.google_location?.address_components?.city) {
          const city = j.google_location.address_components.city;
          const prov = j.google_location.address_components.province;
          location = prov && prov !== city ? `${city}, ${prov}` : `${city}, Indonesia`;
        } else if (j.google_location?.address_components?.province) {
          location = `${j.google_location.address_components.province}, Indonesia`;
        } else if (j.is_work_from_home) {
          location = 'Remote / WFH (Indonesia)';
        }

        let salaryRange: string | undefined;
        if (j.base_salary && Number(j.base_salary) > 0) {
          salaryRange = `Rp ${Number(j.base_salary).toLocaleString('id-ID')} / ${j.salary_interval === 'month' ? 'bulan' : j.salary_interval || 'bulan'}`;
        }

        const fullRawHtml = `${j.description || ''}\n\n<h3>Kualifikasi & Persyaratan:</h3>\n${j.qualifications || ''}`;
        const cleanDesc = cleanHtmlDescription(fullRawHtml);

        candidateJobs.push({
          externalId: `kalibrr-${j.id}`,
          title: j.name,
          companyName: j.company?.name || 'Perusahaan Mitra Terverifikasi',
          jobUrl,
          location,
          salaryRange,
          description: cleanDesc,
          platform: 'KALIBRR'
        });
      }
    } catch (e: any) {
      console.error(`Error querying ${kw}:`, e.message);
    }
  }

  console.log(`\nTotal unique jobs fetched from Kalibrr for Sumedang/Bandung/Jabar: ${candidateJobs.length}`);

  // Ingest for each user via standard pipeline
  for (const user of users) {
    console.log(`\n--- Ingesting for user: ${user.fullName} (${user.city || 'No city'}) ---`);
    const summary = await ingestRawJobs(user.id, candidateJobs);
    console.log(`Hasil Ingestion untuk ${user.fullName}:`, {
      received: summary.totalReceived,
      inserted: summary.inserted,
      passedEvaluation: summary.passedEvaluation,
      skippedDuplicates: summary.skippedDuplicates
    });
  }

  await prisma.$disconnect();
}

fetchAndIngestWestJavaJobs().catch(console.error);
