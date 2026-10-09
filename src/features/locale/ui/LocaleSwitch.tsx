'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/shared/config/locale';

export function LocaleSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  // Route is authoritative. The layout/provider commits locale only after navigation succeeds.
  const current = pathname.startsWith('/en') ? 'en' : locale;
  const target = current === 'fa' ? 'en' : 'fa';
  return (
    <Link
      className="locale-switch"
      href={`/${target}/`}
      hrefLang={target}
      lang={target}
      dir="ltr"
      aria-label={target === 'en' ? 'Switch to English' : 'تغییر زبان به فارسی'}
      scroll={false}
    >
      {target === 'en' ? 'EN' : 'فا'}
      <span aria-hidden="true">↗</span>
    </Link>
  );
}
