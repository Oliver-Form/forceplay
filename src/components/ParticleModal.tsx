import React, { useState } from 'react';
import ReactDOM from 'react-dom';

interface ParticleModalProps {
  particle: {
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    mass: number;
  };
  onSave: (updatedParticle: {
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    mass: number;
  }) => void;
  onCancel: () => void;
}

const ParticleModal: React.FC<ParticleModalProps> = ({ particle, onSave, onCancel }) => {
  const [position, setPosition] = useState(particle.position);
  const [velocity, setVelocity] = useState(particle.velocity);
  const [mass, setMass] = useState(particle.mass);

  const handleSave = () => {
    onSave({ position, velocity, mass });
  };

  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        width: '400px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}>
        <h2>Edit Particle</h2>
        <div>
          <label>
            Position X:
            <input
              type="number"
              value={position.x}
              onChange={(e) => setPosition({ ...position, x: parseFloat(e.target.value) })}
            />
          </label>
        </div>
        <div>
          <label>
            Position Y:
            <input
              type="number"
              value={position.y}
              onChange={(e) => setPosition({ ...position, y: parseFloat(e.target.value) })}
            />
          </label>
        </div>
        <div>
          <label>
            Velocity X:
            <input
              type="number"
              value={velocity.x}
              onChange={(e) => setVelocity({ ...velocity, x: parseFloat(e.target.value) })}
            />
          </label>
        </div>
        <div>
          <label>
            Velocity Y:
            <input
              type="number"
              value={velocity.y}
              onChange={(e) => setVelocity({ ...velocity, y: parseFloat(e.target.value) })}
            />
          </label>
        </div>
        <div>
          <label>
            Mass:
            <input
              type="number"
              value={mass}
              onChange={(e) => setMass(parseFloat(e.target.value))}
            />
          </label>
        </div>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={handleSave}>✅ Save</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')!
  );
};

export default ParticleModal;
