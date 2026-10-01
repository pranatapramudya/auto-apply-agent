import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
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
    });

    const enrichedUsers = users.map((u) => {
      let resumeSize = 0;
      let resumeFileName = '';
      try {
        const fullPath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), u.resumeLocalPath);
        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath);
          resumeSize = stats.size;
          resumeFileName = path.basename(u.resumeLocalPath);
        }
      } catch { }

      return {
        ...u,
        resumeStats: {
          fileName: resumeFileName || path.basename(u.resumeLocalPath),
          sizeBytes: resumeSize,
          isDummy: resumeSize < 10240,
          localPath: u.resumeLocalPath
        }
      };
    });

    return NextResponse.json({ success: true, data: enrichedUsers });
  } catch (error: any) {
    console.error('[API /api/users] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
