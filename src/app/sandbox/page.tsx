"use client";
import React, { useState, useEffect } from 'react';
import WorldCanvas from '../../components/WorldCanvas';

export default function Sandbox() {
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('forceplayExample');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setInitialData(data);
      } catch {
        console.error('Invalid example data');
      }
      localStorage.removeItem('forceplayExample');
    }
  }, []);

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <WorldCanvas initialData={initialData} />
    </main>
  );
}

