/** The pages built so far, and the routes still to come (Phase 4). */
export const PAGES = {
  home: '/',
  plantings: '/plantings',
  'planting-upcoming': '/plantings/example-upcoming',
  'planting-held': '/plantings/silukhanyo-primary-2026-08-29',
  'get-involved': '/get-involved',
  'dedicate-a-tree': '/dedicate-a-tree',
  donate: '/donate',
  'thank-you': '/thank-you/planting',
} as const;

/**
 * Linked from Phase 3 pages but built in Phase 4. The link check allows these;
 * Phase 4 must empty this list.
 */
export const PHASE_4_ROUTES = [
  /^\/our-work$/,
  /^\/about$/,
  /^\/journal$/,
  /^\/privacy$/,
  /^\/get-involved\/propose-a-site$/,
  /^\/get-involved\/partner$/,
  /^\/sites\/[\w-]+$/,
];
