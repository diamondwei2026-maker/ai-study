import {
  defineConfig,
  presetIcons,
  presetUno,
  transformerDirectives,
} from "unocss";

export default defineConfig({
  presets: [presetUno(), presetIcons()],
  transformers: [transformerDirectives()],
  theme: {
    colors: {
      "page-bg": "var(--page-bg)",
      "surface-card": "var(--surface-card)",
      "text-primary": "var(--text-primary)",
      "text-secondary": "var(--text-secondary)",
      "text-tertiary": "var(--text-tertiary)",
      "border-subtle": "var(--border-subtle)",
      "brand-primary": "var(--brand-primary)",
      "brand-secondary": "var(--brand-secondary)",
      "danger-surface": "var(--danger-surface)",
      "danger-text": "var(--danger-text)",
      "home-signal": "var(--home-signal)",
      "home-banner-bg": "var(--home-banner-bg)",
      "home-banner-border": "var(--home-banner-border)",
      "home-banner-text": "var(--home-banner-text)",
      "home-banner-muted": "var(--home-banner-muted)",
      "home-banner-pill": "var(--home-banner-pill)",
      "on-brand": "var(--on-brand)",
      "on-brand-muted": "var(--on-brand-muted)",
      "brand-panel": "var(--brand-panel)",
    },
    boxShadow: {
      card: "var(--shadow-card)",
      fab: "var(--shadow-fab)",
      hero: "var(--shadow-hero)",
    },
  },
  shortcuts: {
    "bg-brand-gradient":
      "bg-[linear-gradient(135deg,var(--brand-primary),var(--brand-secondary))]",
    "card-surface": "rounded-[24rpx] bg-surface-card shadow-card",
    "tab-pill":
      "rounded-[999rpx] border border-border-subtle px-[28rpx] py-[12rpx] text-[24rpx] leading-none",
    "tab-pill-active":
      "border-brand-primary bg-[rgba(94,75,255,0.12)] text-brand-primary",
    "center-flex": "flex items-center justify-center",
    "hero-glass":
      "rounded-[32rpx] border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.12)] shadow-hero backdrop-blur-[14rpx]",
    "pt-safe": "pt-[calc(env(safe-area-inset-top)+0px)]",
    "pb-safe": "pb-[calc(env(safe-area-inset-bottom)+0px)]",
  },
});
