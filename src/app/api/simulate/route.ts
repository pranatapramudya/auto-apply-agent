import { NextRequest, NextResponse } from 'next/server';
import { evaluateAndAct, AgentContext } from '@/services/agent';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, platform } = body;

    if (!text || !platform) {
      return NextResponse.json(
        { error: 'Field "text" dan "platform" wajib diisi.' },
        { status: 400 }
      );
    }

    if (platform !== 'TELEGRAM') {
      return NextResponse.json(
        { error: 'Platform tidak didukung. Gunakan "TELEGRAM".' },
        { status: 400 }
      );
    }

    const internalPlatform = 'TELEGRAM';

    // Membuat dummy context untuk keperluan simulasi
    const context: AgentContext = {
      chatId: `sim_tg_${Date.now()}`
    };

    const result = await evaluateAndAct(text, internalPlatform, context, true);

    return NextResponse.json({
      success: true,
      data: {
        originalText: text,
        platform: platform,
        isRelevant: result !== null,
        result: result || 'Tidak relevan. Tidak ada aksi yang diambil.'
      }
    });

  } catch (error: any) {
    console.error('[API_SIMULATE_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan internal pada server.' },
      { status: 500 }
    );
  }
}
