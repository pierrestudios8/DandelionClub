/** Header and footer navigation (docs/SPEC.md, Sitemap and routes). */

export interface NavLink {
  label: string;
  href: string;
  /** Shown in a drop-down under the link (hover or focus on desktop, listed in the phone menu). */
  children?: NavLink[];
}

export const mainNav: NavLink[] = [
  { label: 'Plantings', href: '/plantings' },
  { label: 'Our work', href: '/our-work', children: [{ label: 'Journal', href: '/journal' }] },
  { label: 'About', href: '/about' },
];

export const mainAction: NavLink = {
  label: 'Get involved',
  href: '/get-involved',
  children: [
    { label: 'Join a planting', href: '/plantings' },
    { label: 'Dedicate a tree', href: '/dedicate-a-tree' },
    { label: 'Donate', href: '/donate' },
    { label: 'Partner with us', href: '/get-involved/partner' },
    { label: 'Propose a site', href: '/get-involved/propose-a-site' },
  ],
};

export const footerVisit: NavLink[] = [
  ...mainNav.flatMap((l) => [{ label: l.label, href: l.href }, ...(l.children ?? [])]),
];

export const footerTakePart: NavLink[] = [
  { label: 'Join a planting', href: '/plantings' },
  { label: 'Dedicate a tree', href: '/dedicate-a-tree' },
  { label: 'Donate', href: '/donate' },
  { label: 'Partner with us', href: '/get-involved/partner' },
];

/** True when `href` is the current page or a section containing it. */
export function isCurrent(href: string, pathname: string): boolean {
  const path = pathname.replace(/\/$/, '') || '/';
  return href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`);
}
