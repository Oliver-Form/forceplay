import ParticleField from '../components/ParticleField'

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">ForcePlay: Physics Sandbox</h1>
      <ParticleField />
    </main>
  )
}
