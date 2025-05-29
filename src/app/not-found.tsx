import Link from 'next/link';
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

export default function NotFound() {
  return (
    <div className="wrapper" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <main className={roboto.className}>
        <h1 style={{ fontSize: '4rem', margin: '0' }}>404</h1>
        <p style={{ fontSize: '1.25rem', margin: '1rem 0', color: '#666' }}>
          Oops! The page you are looking for doesn&apos;t exist.
        </p>
        <Link href="/" style={{
          display: 'inline-block',
          marginTop: '2rem',
          padding: '0.75rem 1.5rem',
          background: '#2196f3',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '4px',
        }}>
          Go back Home
        </Link>
      </main>
    </div>
  );
}
