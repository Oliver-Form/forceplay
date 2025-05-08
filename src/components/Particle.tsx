'use client'

import React from 'react'
import { Particle as ParticleType } from '../lib/types'

type Props = {
  particle: ParticleType
}

export default function Particle({ particle }: Props) {
  const { x, y, radius, color } = particle

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
