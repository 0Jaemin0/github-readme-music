import { NextResponse } from 'next/server';
import { isStoredCardId, readStoredCard } from '@/entities/music-card/server';
import { captureMonitoringError } from '@/shared/lib/sentry-monitoring';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const CARD_RESTORE_CACHE_CONTROL = 'public, max-age=1800, s-maxage=3600';

const errorResponse = (status: number, code: string, message: string) => {
  return NextResponse.json({ error: { code, message } }, { status });
};

export const GET = async (_request: Request, { params }: RouteContext) => {
  const { id } = await params;
  if (!isStoredCardId(id)) {
    return errorResponse(400, 'INVALID_CARD_ID', '카드 요청이 올바르지 않습니다.');
  }

  try {
    const card = await readStoredCard(id);
    if (card.type === 'not_found') {
      return errorResponse(404, 'CARD_NOT_FOUND', '카드를 찾을 수 없습니다.');
    }
    if (card.type === 'invalid_data') {
      captureMonitoringError({
        message: '저장된 카드 설정을 처리할 수 없습니다',
        errorCode: 'stored_card_restore_invalid_data',
        operation: 'stored_card_restore',
        layer: 'server',
      });
      return errorResponse(500, 'CARD_DATA_INVALID', '카드 설정을 처리할 수 없습니다.');
    }

    return NextResponse.json(
      {
        data: {
          videoId: card.videoId,
          params: card.cardData.params,
        },
      },
      { headers: { 'Cache-Control': CARD_RESTORE_CACHE_CONTROL } },
    );
  } catch {
    captureMonitoringError({
      message: '저장된 카드 설정 조회에 실패했습니다',
      errorCode: 'stored_card_restore_failed',
      operation: 'stored_card_restore',
      layer: 'server',
      httpStatus: 503,
    });
    return errorResponse(503, 'CARD_READ_UNAVAILABLE', '카드 설정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
};
