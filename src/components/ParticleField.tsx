'use client'

import React, { useState, useEffect } from 'react'
import { Particle } from '../lib/types'
import ParticleComponent from './Particle'

export default function ParticleField() {
  const [particles, setParticles] = useState<Particle[]>([]) // Initialize with an empty array
  const [selectedParticle, setSelectedParticle] = useState<Particle | null>(null)
  const [isPaused, setIsPaused] = useState(true) // Start in paused state

  const getParticleLabel = (index: number): string => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'
    const baseLabel = alphabet[index % 26]
    const subscript = Math.floor(index / 26) + 1
    return index < 26 ? baseLabel : `${baseLabel}₁`.replace('₁', subscript.toString())
  }

  const addParticle = () => {
    const newParticle: Particle = {
      id: getParticleLabel(particles.length),
      x: 0, // Temporary value, will be adjusted below
      y: 340,
      radius: 50,
      color: '#ffffff',
      mass: 5, // Default mass
      velocity: 0, // Default velocity
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

  const updateParticle = (updatedParticle: Particle) => {
    setParticles((prevParticles) =>
      prevParticles.map((particle) =>
        particle.id === updatedParticle.id ? updatedParticle : particle
      )
    )
  }

  const handleCollisions = () => {
    const minX = -500
    const maxX = 900

    setParticles((prevParticles) => {
      const updatedParticles = [...prevParticles]

      // Handle collisions between particles
      for (let i = 0; i < updatedParticles.length - 1; i++) {
        const p1 = updatedParticles[i]
        const p2 = updatedParticles[i + 1]

        if (Math.abs(p1.x - p2.x) <= p1.radius + p2.radius) {
          // Conservation of linear momentum and Newton's experimental law (e=1)
          const v1 = p1.velocity
          const v2 = p2.velocity
          const m1 = p1.mass
          const m2 = p2.mass

          updatedParticles[i].velocity = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2)
          updatedParticles[i + 1].velocity = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2)
        }
      }

      // Handle collisions with walls
      updatedParticles.forEach((particle) => {
        if (particle.x - particle.radius <= minX || particle.x + particle.radius >= maxX) {
          particle.velocity *= -1 // Reverse velocity on wall collision
        }
      })

      return updatedParticles
    })
  }

  const moveParticles = () => {
    setParticles((prevParticles) =>
      prevParticles.map((particle) => ({
        ...particle,
        x: particle.x + particle.velocity, // Update position based on velocity
      }))
    )
  }

  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        moveParticles()
        handleCollisions()
      }, 16) // ~60 FPS
      return () => clearInterval(interval)
    }
  }, [isPaused])

  return (
    <div className="w-full h-[500px] bg-gray-100 border border-gray-300 rounded-lg shadow">
      <div className="flex justify-between p-2">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className={`p-2 rounded-full shadow ${
            isPaused ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
          } text-white`}
        >
          {isPaused ? 'Play' : 'Pause'}
        </button>
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
          <ParticleComponent
            key={particle.id}
            particle={particle}
            onClick={() => isPaused && setSelectedParticle(particle)} // Set selected particle only if paused
          />
        ))}
      </svg>
      {selectedParticle && (
        <div className="p-4 bg-white border border-gray-300 rounded-lg shadow mt-4">
          <h3 className="text-lg font-bold">
            Edit Particle {selectedParticle.id.toUpperCase()} {/* Add particle letter */}
          </h3>
          <table className="table-auto w-full mt-2">
            <thead>
              <tr>
                <th className="px-4 py-2">Attribute</th>
                <th className="px-4 py-2">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-4 py-2">Mass</td>
                <td className="border px-4 py-2">
                  <input
                    type="number"
                    value={isNaN(selectedParticle.mass) ? '' : selectedParticle.mass} // Default to empty string if NaN
                    onChange={(e) =>
                      setSelectedParticle({
                        ...selectedParticle,
                        mass: parseFloat(e.target.value) || 0, // Default to 0 if input is empty
                      })
                    }
                    onBlur={() => updateParticle(selectedParticle)}
                    className="w-full border rounded px-2 py-1"
                  />
                </td>
              </tr>
              <tr>
                <td className="border px-4 py-2">Velocity</td>
                <td className="border px-4 py-2">
                  <input
                    type="number"
                    value={isNaN(selectedParticle.velocity) ? '' : selectedParticle.velocity} // Default to empty string if NaN
                    onChange={(e) =>
                      setSelectedParticle({
                        ...selectedParticle,
                        velocity: parseFloat(e.target.value) || 0, // Default to 0 if input is empty
                      })
                    }
                    onBlur={() => updateParticle(selectedParticle)}
                    className="w-full border rounded px-2 py-1"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
