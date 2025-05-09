'use client';

import ParticleCanvas from './ParticleCanvas';
import { ParticleSet } from './ParticleSet';

const particleSet = new ParticleSet(20); // Set a uniform radius of 20 for all particles
particleSet.addParticle(950, 400);

export default function Home() {
  return (
    <main
      className="flex flex-col items-center min-h-screen"
      style={{ backgroundColor: '#8a96ad' }}
    >
      <h1 className="text-center mb-4">Forcebox Particle View</h1>
      <ParticleCanvas particleSet={particleSet} />
    </main>
  );
}
