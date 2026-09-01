export function compactTickerGap(viewportWidth: number, contentWidth: number) {
  return Math.max(0, Math.round(viewportWidth - contentWidth))
}
