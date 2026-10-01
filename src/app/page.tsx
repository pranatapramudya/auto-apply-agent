import prisma from '../lib/prisma';
import React from 'react';
import fs from 'fs';
import path from 'path';
import JobHunterDashboard, { UserItem, JobItem } from '../components/JobHunterDashboard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [users, jobs] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        city: true,
        linkedInUrl: true,
        githubUrl: true,
        portfolioUrl: true,
        targetRoles: true,
        coreSkills: true,
        expectedSalary: true,
        resumeLocalPath: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { listings: true }
        }
      }
    }),
    prisma.jobListing.findMany({
      orderBy: [
        { matchScore: 'desc' },
        { createdAt: 'desc' }
      ]
    })
  ]);

  const formattedUsers: UserItem[] = users.map((u) => {
    let resumeSize = 0;
    let resumeFileName = '';
    try {
      const fullPath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), u.resumeLocalPath);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        resumeSize = stats.size;
        resumeFileName = path.basename(u.resumeLocalPath);
      }
    } catch {}

    return {
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      city: u.city,
      linkedInUrl: u.linkedInUrl,
      githubUrl: u.githubUrl,
      portfolioUrl: u.portfolioUrl,
      targetRoles: u.targetRoles,
      coreSkills: u.coreSkills,
      expectedSalary: u.expectedSalary,
      resumeLocalPath: u.resumeLocalPath,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
      _count: u._count,
      resumeStats: {
        fileName: resumeFileName || path.basename(u.resumeLocalPath),
        sizeBytes: resumeSize,
        isDummy: resumeSize < 10240,
        localPath: u.resumeLocalPath
      }
    };
  });

  const formattedJobs: JobItem[] = jobs.map((j) => ({
    id: j.id,
    userId: j.userId,
    platform: j.platform,
    title: j.title,
    companyName: j.companyName,
    jobUrl: j.jobUrl,
    location: j.location,
    salaryRange: j.salaryRange,
    description: j.description,
    isLegit: j.isLegit,
    scamReason: j.scamReason,
    matchScore: j.matchScore,
    status: j.status,
    failureReason: j.failureReason,
    appliedAt: j.appliedAt ? j.appliedAt.toISOString() : null,
    createdAt: j.createdAt.toISOString()
  }));

  return <JobHunterDashboard initialUsers={formattedUsers} initialJobs={formattedJobs} />;
}
