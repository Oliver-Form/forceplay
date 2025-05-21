import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Vector2D } from '../lib/physics/Vector2D';

interface ParticleModalProps {
  particle: {
    position: Vector2D;
    velocity: Vector2D;
    mass: number;
    appliedForce: Vector2D;
    isStationary: boolean; // Add isStationary to the particle type
  };
  onSave: (updatedParticle: {
    position: Vector2D;
    velocity: Vector2D;
    mass: number;
    appliedForce: Vector2D;
    isStationary: boolean;
  }) => void;
  onCancel: () => void;
}

const ParticleModal: React.FC<ParticleModalProps> = ({ particle, onSave, onCancel }) => {
  const [position, setPosition] = useState(particle.position);
  const [velocity, setVelocity] = useState(particle.velocity);
  const [mass, setMass] = useState(particle.mass);
  const [appliedForce, setAppliedForce] = useState(particle.appliedForce);
  const [isStationary, setIsStationary] = useState(particle.isStationary ?? false);

  const handleSave = () => {
    onSave({
      position,
      velocity,
      mass,
      appliedForce,
      isStationary, // Include isStationary in the save
    });
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
        backgroundColor: '#888',
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
              onChange={(e) => setPosition(new Vector2D(Number(e.target.value), position.y))}
            />
          </label>
        </div>
        <div>
          <label>
            Position Y:
            <input
              type="number"
              value={position.y}
              onChange={(e) => setPosition(new Vector2D(position.x, Number(e.target.value)))}
            />
          </label>
        </div>
        <div>
          <label>
            Velocity X:
            <input
              type="number"
              value={velocity.x}
              onChange={(e) => setVelocity(new Vector2D(Number(e.target.value), velocity.y))}
            />
          </label>
        </div>
        <div>
          <label>
            Velocity Y:
            <input
              type="number"
              value={velocity.y}
              onChange={(e) => setVelocity(new Vector2D(velocity.x, Number(e.target.value)))}
            />
          </label>
        </div>
        <div>
          <label>
            Mass:
            <input
              type="number"
              value={mass}
              onChange={(e) => setMass(Number(e.target.value))}
            />
          </label>
        </div>
        <div>
          <label>
            Force X:
            <input
              type="number"
              value={appliedForce.x}
              onChange={(e) => setAppliedForce(new Vector2D(Number(e.target.value), appliedForce.y))}
            />
          </label>
        </div>
        <div>
          <label>
            Force Y:
            <input
              type="number"
              value={appliedForce.y}
              onChange={(e) => setAppliedForce(new Vector2D(appliedForce.x, Number(e.target.value)))}
            />
          </label>
        </div>
        <div>
          <label>
            Stationary:
            <input
              type="checkbox"
              checked={isStationary}
              onChange={(e) => setIsStationary(e.target.checked)} 
            />
          </label>
        </div>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={handleSave}>
              <img src="/check-mark.svg" alt="Save" style={{ width: '16px', height: '16px' }} />
            </button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')!
  );
};

export default ParticleModal;

