import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { ExperienceProvider } from '@/entities/experience/model/provider';
import { compositionFor, resolveLocale } from '@/shared/config/locale';
import { content } from '@/shared/config/content';
import { siteOrigin } from '@/shared/config/site';
import '../globals.css';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale?: string[] }>;
};

export const dynamicParams = false;
export function generateStaticParams() {
  return [{ locale: [] }, { locale: ['fa'] }, { locale: ['en'] }];
}

export const viewport: Viewport = {
  themeColor: '#121212',
  colorScheme: 'dark',
};

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  if (!locale) notFound();
  const title =
    locale === 'fa' ? 'برقینو — انرژی با دقت مهندسی' : 'Barghino — Power, with precision';
  return {
    title,
    description: content[locale].metadataDescription,
    icons: { icon: '/icon.svg' },
    ...(siteOrigin
      ? {
          metadataBase: siteOrigin,
          alternates: {
            canonical: `/${locale}/`,
            languages: { fa: '/fa/', en: '/en/', 'x-default': '/' },
          },
          openGraph: {
            title,
            description: content[locale].metadataDescription,
            type: 'website',
            locale: locale === 'fa' ? 'fa_IR' : 'en_US',
            url: `/${locale}/`,
          },
        }
      : {}),
  };
}

export default async function RootLayout({ children, params }: Props) {
  const locale = resolveLocale((await params).locale);
  if (!locale) notFound();
  return (
    <html lang={locale} dir={compositionFor(locale).direction}>
      <body>
        <ExperienceProvider locale={locale}>
          <a className="skip-link" href="#main">
            {content[locale].skip}
          </a>
          <div id="smooth-content">{children}</div>
        </ExperienceProvider>
      </body>
    </html>
  );
}
