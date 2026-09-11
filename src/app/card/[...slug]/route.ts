import { NextResponse } from "next/server";
import { isStoredCardId, normalizeStoredCardData } from "@/features/card-generator/lib/stored-card";
import { embedSvgCover } from "@/features/card-generator/lib/svg-cover.server";
import { isSvgVideoId, parseSvgCardData, renderSvgCard, type SvgCardData } from "@/features/card-generator/lib/svg-card";
import { captureMonitoringError } from "@/lib/sentry-monitoring";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string[] }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const [fileName] = slug;
  const cardKey = fileName?.endsWith(".svg") ? fileName.slice(0, -4) : "";

  if (slug.length !== 1) return new NextResponse("카드 요청이 올바르지 않습니다.", { status: 400 });

  if (isStoredCardId(cardKey)) {
    const storedCard = await readStoredCard(cardKey);
    if (storedCard instanceof NextResponse) return storedCard;
    return renderCard(storedCard.data, storedCard.videoId);
  }

  if (cardKey.startsWith("c_") || !isSvgVideoId(cardKey)) {
    return new NextResponse("카드 요청이 올바르지 않습니다.", { status: 400 });
  }

  return renderCard(parseSvgCardData(new URL(request.url).searchParams), cardKey);
}

async function renderCard(data: SvgCardData, videoId: string) {
  const card = await embedSvgCover(data, videoId);
  return new NextResponse(renderSvgCard(card.data), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": card.hasEmbeddedCover ? "public, max-age=300, s-maxage=300" : "no-store",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function readStoredCard(id: string): Promise<{ videoId: string; data: SvgCardData } | NextResponse> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("cards")
      .select("video_id, card_data")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return new NextResponse("카드를 찾을 수 없습니다.", { status: 404 });

    const videoId = typeof data.video_id === "string" ? data.video_id : "";
    const storedCardData = normalizeStoredCardData(data.card_data, videoId);
    if (!storedCardData) {
      captureMonitoringError({
        message: "저장된 카드 설정을 처리할 수 없습니다",
        errorCode: "stored_card_invalid_data",
        operation: "stored_card_read",
        layer: "server",
      });
      return new NextResponse("카드 데이터를 처리할 수 없습니다.", { status: 500 });
    }

    return { videoId, data: parseSvgCardData(new URLSearchParams(storedCardData.params)) };
  } catch {
    captureMonitoringError({
      message: "저장된 카드 조회에 실패했습니다",
      errorCode: "stored_card_read_failed",
      operation: "stored_card_read",
      layer: "server",
      httpStatus: 503,
    });
    return new NextResponse("카드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.", { status: 503 });
  }
}
