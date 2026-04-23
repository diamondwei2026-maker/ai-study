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
      "border-subtle": "var(--border-subtle)",
      "brand-primary": "var(--brand-primary)",
      "brand-secondary": "var(--brand-secondary)",
      "danger-surface": "var(--danger-surface)",
      "danger-text": "var(--danger-text)",
      "on-brand": "var(--on-brand)",
      "on-brand-muted": "var(--on-brand-muted)",
      "brand-panel": "var(--brand-panel)",
    },
    boxShadow: {
      card: "var(--shadow-card)",
      fab: "var(--shadow-fab)",
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
    "pt-safe": "pt-[calc(env(safe-area-inset-top)+0px)]",
    "pb-safe": "pb-[calc(env(safe-area-inset-bottom)+0px)]",
  },
});
