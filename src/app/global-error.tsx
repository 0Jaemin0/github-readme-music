"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <main style={{ display: "grid", minHeight: "100vh", placeItems: "center", padding: "24px" }}>
          <section style={{ maxWidth: "360px", textAlign: "center" }}>
            <h1 style={{ margin: 0, fontSize: "24px" }}>문제가 발생했어요.</h1>
            <p style={{ margin: "12px 0 20px", color: "#525252", lineHeight: 1.6 }}>
              페이지를 새로고침한 뒤 다시 시도해 주세요.
            </p>
            <button type="button" onClick={() => window.location.reload()}>
              새로고침
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
