import * as Sentry from "@sentry/nextjs";

type MonitoringError = {
  message: string;
  errorCode: string;
  operation: string;
  layer: "client" | "server";
  httpStatus?: number;
};

export function captureMonitoringError({ message, errorCode, operation, layer, httpStatus }: MonitoringError) {
  const monitoredError = new Error(message);

  Sentry.withScope((scope) => {
    scope.setLevel("error");
    scope.setTag("error_code", errorCode);
    scope.setTag("error_operation", operation);
    scope.setTag("layer", layer);
    if (httpStatus) scope.setTag("http_status", String(httpStatus));
    scope.setFingerprint([errorCode]);
    Sentry.captureException(monitoredError);
  });
}
