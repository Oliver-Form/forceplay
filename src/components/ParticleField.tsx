'use client'

import React, { useState } from 'react'
import { Particle } from '../lib/types'
import ParticleComponent from './Particle'

export default function ParticleField() {
  const [particles, setParticles] = useState<Particle[]>([
    { id: 'a', x: -300, y: 300, radius: 50, color: '#ffffff' },
    { id: 'b', x: 200, y: 300, radius: 50, color: '#ffffff' },
    { id: 'c', x: 800, y: 300, radius: 50, color: '#ffffff' },
  ])

  return (
    <div className="w-full h-[500px] bg-gray-100 border border-gray-300 rounded-lg shadow">
      <svg width="100%" height="100%" viewBox="0 0 400 400">
        <line x1="-1000" y1="390" x2="1000" y2="390" stroke="black" strokeWidth="1" />
        {particles.map((particle) => (
          <ParticleComponent key={particle.id} particle={particle} />
        ))}
      </svg>
    </div>
  )
}
