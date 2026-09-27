/** Header and footer navigation (docs/SPEC.md, Sitemap and routes). */

export interface NavLink {
  label: string;
  href: string;
}

export const mainNav: NavLink[] = [
  { label: 'Plantings', href: '/plantings' },
  { label: 'Our work', href: '/our-work' },
  { label: 'About', href: '/about' },
  { label: 'Journal', href: '/journal' },
];

export const mainAction: NavLink = { label: 'Get involved', href: '/get-involved' };

export const footerVisit: NavLink[] = mainNav;

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
