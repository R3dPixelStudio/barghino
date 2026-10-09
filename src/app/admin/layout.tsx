import type { Metadata } from 'next';
import '../globals.css';
import './admin.css';

export const metadata: Metadata = {
  title: 'برقینو — مدیریت محتوا',
  robots: { index: false, follow: false },
  icons: { icon: '/icon.svg' },
};
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
