import { NextRequest, NextResponse } from 'next/server';
import { evaluateAndAct, AgentContext } from '@/services/agent';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tweetId, username, text } = body;

    if (!tweetId || !username || !text) {
      return NextResponse.json(
        { error: 'Field "tweetId", "username", dan "text" wajib diisi pada body JSON.' },
        { status: 400 }
      );
    }

    const context: AgentContext = {
      tweetId,
      username // username untuk keperluan spesifik sniper mode jika butuh context tambahan
    };

    // isSimulation diatur false secara hardcode agar sistem mengeksekusi reply X secara nyata
    console.log(`[SNIPER-MODE] Mengirim prompt untuk dianalisis LLM dari user @${username}`);
    const result = await evaluateAndAct(text, 'X', context, false);

    return NextResponse.json({
      success: true,
      message: "Sniper mode eksekusi selesai",
      data: {
        tweetId,
        username,
        originalText: text,
        isRelevant: result !== null,
        result: result || 'Tidak relevan. Agent tidak membalas tweet ini.'
      }
    });

  } catch (error: any) {
    console.error('[API_SNIPER_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan internal pada server saat mengeksekusi sniper.' },
      { status: 500 }
    );
  }
}
