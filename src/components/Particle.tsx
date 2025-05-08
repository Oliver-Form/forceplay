'use client'

import React from 'react'
import { Particle as ParticleType } from '../lib/types'

type Props = {
  particle: ParticleType
}

export default function Particle({ particle }: Props) {
  const { x = 0, y = 0, radius, color } = particle // Default x and y to 0 if undefined or NaN

  return (
    <circle
      cx={x}
      cy={y}
      r={radius}
      fill={color}
      stroke="#000"
      strokeWidth={1}
    />
  )
}
