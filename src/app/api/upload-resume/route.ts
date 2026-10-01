import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const userId = formData.get('userId') as string | null;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Parameter userId wajib disertakan.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan.' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // 1. Ekstraksi Field Biodata Profil
    const fullName = formData.get('fullName') as string | null;
    const phone = formData.get('phone') as string | null;
    const city = formData.get('city') as string | null;
    const linkedInUrl = formData.get('linkedInUrl') as string | null;
    const githubUrl = formData.get('githubUrl') as string | null;
    const portfolioUrl = formData.get('portfolioUrl') as string | null;
    const expectedSalary = formData.get('expectedSalary') as string | null;
    const targetRoles = formData.get('targetRoles') as string | null;
    const coreSkills = formData.get('coreSkills') as string | null;

    if (fullName !== null && fullName.trim()) updateData.fullName = fullName.trim();
    if (phone !== null) updateData.phone = phone.trim();
    if (city !== null) updateData.city = city.trim();
    if (linkedInUrl !== null) updateData.linkedInUrl = linkedInUrl.trim();
    if (githubUrl !== null) updateData.githubUrl = githubUrl.trim();
    if (portfolioUrl !== null) updateData.portfolioUrl = portfolioUrl.trim();
    if (targetRoles !== null) updateData.targetRoles = targetRoles.trim();
    if (coreSkills !== null) updateData.coreSkills = coreSkills.trim();
    if (expectedSalary !== null) {
      const salaryNum = parseInt(expectedSalary.replace(/\D/g, ''), 10);
      updateData.expectedSalary = isNaN(salaryNum) ? null : salaryNum;
    }

    // 2. Pemrosesan Upload File PDF Resume
    const resumeFile = formData.get('resume') as File | null;
    let resumeSize = 0;
    let resumeFileName = '';

    if (resumeFile && typeof resumeFile === 'object' && resumeFile.size > 0) {
      const originalName = resumeFile.name || 'resume.pdf';
      if (!originalName.toLowerCase().endsWith('.pdf') && resumeFile.type !== 'application/pdf') {
        return NextResponse.json(
          { success: false, error: 'Format berkas tidak valid. Hanya berkas PDF (.pdf) yang diizinkan.' },
          { status: 400 }
        );
      }

      const assetsDir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), 'assets');
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }

      // Format nama file: resume-[nama-user]-[timestamp].pdf
      const safeUserName = user.fullName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20);
      const fileName = `resume-${safeUserName}-${Date.now()}.pdf`;
      const targetFilePath = path.join(assetsDir, fileName);

      const arrayBuffer = await resumeFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      fs.writeFileSync(targetFilePath, buffer);

      resumeSize = buffer.length;
      resumeFileName = fileName;
      updateData.resumeLocalPath = `./assets/${fileName}`;
    } else if (user.resumeLocalPath) {
      // Periksa info file yang sudah ada
      const existingPath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), user.resumeLocalPath);
      if (fs.existsSync(existingPath)) {
        const stats = fs.statSync(existingPath);
        resumeSize = stats.size;
        resumeFileName = path.basename(user.resumeLocalPath);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Profil dan berkas resume berhasil diperbarui.',
      data: {
        user: updatedUser,
        resumeInfo: {
          fileName: resumeFileName || path.basename(updatedUser.resumeLocalPath),
          sizeBytes: resumeSize,
          isDummy: resumeSize < 10240, // Kurang dari 10KB diduga berkas belum lengkap
          localPath: updatedUser.resumeLocalPath
        }
      }
    });
  } catch (error: any) {
    console.error('[API /api/upload-resume] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan internal server saat mengunggah resume.' },
      { status: 500 }
    );
  }
}
