import HomeWorldCanvas from '../components/HomeWorldCanvas';
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

export default function Home() {
  return (
    <div className="wrapper">
    <main className={roboto.className} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <HomeWorldCanvas />
    </main>
    </div>
  );
}