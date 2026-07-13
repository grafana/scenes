export {};

declare global {
  interface Window {
    /**
     * Chromedp binding injected by grafana-image-renderer for report rendering communication.
     */
    __grafanaImageRendererMessageChannel?: (message: string) => void;
  }
}
