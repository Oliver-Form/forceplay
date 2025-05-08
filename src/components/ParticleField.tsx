'use client'

import React, { useState } from 'react'
import { Particle } from '../lib/types'
import ParticleComponent from './Particle'

export default function ParticleField() {
  const [particles, setParticles] = useState<Particle[]>([]) // Initialize with an empty array

  const addParticle = () => {
    const newParticle: Particle = {
      id: `p${particles.length + 1}`,
      x: 0, // Temporary value, will be adjusted below
      y: 340,
      radius: 50,
      color: '#ffffff',
    }
    const updatedParticles = [...particles, newParticle]
    const minX = -500
    const maxX = 900
    const totalParticles = updatedParticles.length

    // Avoid division by zero
    const spacing = totalParticles > 1 ? (maxX - minX) / (totalParticles - 1) : 0

    // Adjust all particle positions to be evenly spaced
    const adjustedParticles = updatedParticles.map((particle, index) => ({
      ...particle,
      x: minX + index * spacing,
    }))

    setParticles(adjustedParticles)
  }

  return (
    <div className="w-full h-[500px] bg-gray-100 border border-gray-300 rounded-lg shadow">
      <div className="flex justify-end p-2">
        <button
          onClick={addParticle}
          className="p-2 bg-blue-500 text-white rounded-full shadow hover:bg-blue-600"
        >
          +
        </button>
      </div>
      <svg width="100%" height="100%" viewBox="0 0 400 400">
        <line x1="-1000" y1="390" x2="1000" y2="390" stroke="black" strokeWidth="1" />
        {particles.map((particle) => (
          <ParticleComponent key={particle.id} particle={particle} />
        ))}
      </svg>
    </div>
  )
}
