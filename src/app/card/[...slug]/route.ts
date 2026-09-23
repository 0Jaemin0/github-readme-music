import { NextResponse } from 'next/server';
import {
  embedSvgCover,
  isStoredCardId,
  isSvgVideoId,
  parseSvgCardData,
  readStoredCard,
  renderSvgCard,
  type SvgCardData,
} from '@/entities/music-card/server';
import { captureMonitoringError } from '@/shared/lib/sentry-monitoring';
import { NO_STORE_CACHE_CONTROL, THIRTY_DAYS_IMMUTABLE_CACHE_CONTROL } from '@/shared/lib/server/cache-policy';

export const dynamic = 'force-dynamic';

interface CardSlugRouteParams {
  slug: string[];
}

interface RouteContext {
  params: Promise<CardSlugRouteParams>;
}

const errorResponse = (message: string, status: number) => {
  return new NextResponse(message, { status, headers: { 'Cache-Control': NO_STORE_CACHE_CONTROL } });
};

export const GET = async (request: Request, { params }: RouteContext) => {
  const { slug } = await params;
  const [fileName] = slug;
  const cardKey = fileName?.endsWith('.svg') ? fileName.slice(0, -4) : '';

  if (slug.length !== 1) return errorResponse('카드 요청이 올바르지 않습니다.', 400);

  if (isStoredCardId(cardKey)) {
    return renderStoredCard(cardKey);
  }

  if (cardKey.startsWith('c_') || !isSvgVideoId(cardKey)) {
    return errorResponse('카드 요청이 올바르지 않습니다.', 400);
  }

  return renderCard(parseSvgCardData(new URL(request.url).searchParams), cardKey);
};

const renderCard = async (data: SvgCardData, videoId: string) => {
  const card = await embedSvgCover(data, videoId);
  return new NextResponse(renderSvgCard(card.data), {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': card.hasEmbeddedCover ? THIRTY_DAYS_IMMUTABLE_CACHE_CONTROL : NO_STORE_CACHE_CONTROL,
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:",
      'X-Content-Type-Options': 'nosniff',
    },
  });
};

const renderStoredCard = async (id: string) => {
  try {
    const card = await readStoredCard(id);
    if (card.type === 'not_found') return errorResponse('카드를 찾을 수 없습니다.', 404);
    if (card.type === 'invalid_data') {
      captureMonitoringError({
        message: '저장된 카드 설정을 처리할 수 없습니다',
        errorCode: 'stored_card_invalid_data',
        operation: 'stored_card_read',
        layer: 'server',
      });
      return errorResponse('카드 데이터를 처리할 수 없습니다.', 500);
    }

    return renderCard(parseSvgCardData(new URLSearchParams(card.cardData.params)), card.videoId);
  } catch {
    captureMonitoringError({
      message: '저장된 카드 조회에 실패했습니다',
      errorCode: 'stored_card_read_failed',
      operation: 'stored_card_read',
      layer: 'server',
      httpStatus: 503,
    });
    return errorResponse('카드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.', 503);
  }
};
