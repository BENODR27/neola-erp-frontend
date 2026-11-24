/** Default product identity. Deployment environments may override individual fields. */
export const PRODUCT_BRANDING = {
  appName: 'NeoLA',
  appShortName: 'NeoLA',
  appDescription: 'NeoLA — Apparel & Textiles ERP',
  logoPath: '/assets/neola-woven-logo.png',
  logoCompactPath: '/assets/neola-woven-logo.png',
  faviconPath: '/assets/neola-woven-logo.png',
  defaultTitle: 'NeoLA',
} as const;

/** Shared brand story for Login and Home. */
export const PRODUCT_STORY = Object.freeze({
  platform: 'Apparel & Textiles ERP',
  introduction: 'A new era of',
  industry: 'Loom & Apparel',
  meaning: 'Neo — New era · LA — Loom & Apparel',
});
