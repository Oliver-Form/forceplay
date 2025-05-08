'use client'

import React from 'react'
import { Particle as ParticleType } from '../lib/types'

type Props = {
  particle: ParticleType
  onClick?: () => void // Optional click handler
}

export default function Particle({ particle, onClick }: Props) {
  const { x = 0, y = 0, radius, color, id, mass } = particle // Include mass for display

  return (
    <>
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={color}
        stroke="#000"
        strokeWidth={1}
        onClick={onClick} // Attach click handler
        style={{ cursor: 'pointer' }} // Change cursor to pointer
      />
      <text
        x={x}
        y={y - 6} // Position label slightly above the center
        textAnchor="middle"
        fontSize="16" // Font size for label
        fill="black"
        dominantBaseline="middle" // Ensures vertical centering
      >
        {id.toUpperCase()} {/* Ensure label is capitalized */}
      </text>
      <text
        x={x}
        y={y + 12} // Position mass slightly below the center
        textAnchor="middle"
        fontSize="12" // Smaller font size for mass
        fill="black" // Black color for mass
        dominantBaseline="middle" // Ensures vertical centering
      >
        {mass}KG {/* Display mass with KG */}
      </text>
    </>
  )
}
