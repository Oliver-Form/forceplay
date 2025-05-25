'use client';

import React from 'react';
import VisualiserCanvas from '../../components/VisualiserCanvas';

export default function Visualiser() {
  return (
    <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <VisualiserCanvas />
    </main>
  );
}

