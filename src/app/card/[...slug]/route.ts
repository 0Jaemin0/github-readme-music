import { NextResponse } from "next/server";
import { isSvgVideoId, parseSvgCardData, renderSvgCard } from "@/features/card-generator/lib/svg-card";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string[] }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const [fileName] = slug;
  const videoId = fileName?.endsWith(".svg") ? fileName.slice(0, -4) : "";

  if (slug.length !== 1 || !isSvgVideoId(videoId)) return new NextResponse("Invalid card request", { status: 400 });

  const data = parseSvgCardData(new URL(request.url).searchParams);
  return new NextResponse(renderSvgCard(data), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
