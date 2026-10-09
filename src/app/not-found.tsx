import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="fa" dir="rtl">
      <body
        style={{
          background: '#121212',
          color: '#f2f1ed',
          padding: '10vh 10vw',
          fontFamily: 'sans-serif',
        }}
      >
        <main>
          <h1>۴۰۴</h1>
          <p>این صفحه پیدا نشد.</p>
          <Link href="/">بازگشت به خانه / Home</Link>
        </main>
      </body>
    </html>
  );
}
