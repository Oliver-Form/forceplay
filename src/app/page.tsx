import WorldCanvas from '../components/WorldCanvas';

export default function Home() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2rem' }}>
      <h1 style={{ textAlign: 'center', fontSize: '3rem', fontWeight: 'bold' }}>ForcePlay</h1>
      <WorldCanvas />
    </main>
  );
}
