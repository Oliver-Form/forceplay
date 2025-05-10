import { Particle } from './Particle';
import { Vector2D } from './Vector2D';

export class World {
  particles: Particle[] = [];

  // Add particle to the world
  addParticle(p: Particle) {
    this.particles.push(p);
  }

  // Run physics for each step ('time' delta dt)
  step(dt: number) {
    for (const p of this.particles) {
      // Apply gravity force
      const gravity = new Vector2D(0, -9.8 * p.mass); // F = m * g, inverted for flipped y-axis

      // Include appliedForce in the net force calculation
      const netForce = gravity.add(p.appliedForce);
      const acceleration = netForce.scale(1 / p.mass);
      p.velocity = p.velocity.add(acceleration.scale(dt));
      p.position = p.position.add(p.velocity.scale(dt));
    }

    // Handle particle-to-particle collisions
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];

        const dx = p2.position.x - p1.position.x;
        const dy = p2.position.y - p1.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = 20; // Diameter of particles (2 * radius)

        if (distance < minDistance) {
          // Resolve overlap
          const overlap = minDistance - distance;
          const nx = dx / distance;
          const ny = dy / distance;

          p1.position.x -= (overlap / 2) * nx;
          p1.position.y -= (overlap / 2) * ny;
          p2.position.x += (overlap / 2) * nx;
          p2.position.y += (overlap / 2) * ny;

          // Resolve velocity using conservation of momentum and Newton's experimental law
          const relativeVelocityX = p2.velocity.x - p1.velocity.x;
          const relativeVelocityY = p2.velocity.y - p1.velocity.y;
          const dotProduct = relativeVelocityX * nx + relativeVelocityY * ny;

          if (dotProduct > 0) {
            continue; // Particles are moving apart
          }

          const e = 1; // Coefficient of restitution
          const impulse = (-(1 + e) * dotProduct) / (1 / p1.mass + 1 / p2.mass);

          const impulseX = impulse * nx;
          const impulseY = impulse * ny;

          p1.velocity.x -= impulseX / p1.mass;
          p1.velocity.y -= impulseY / p1.mass;
          p2.velocity.x += impulseX / p2.mass;
          p2.velocity.y += impulseY / p2.mass;
        }
      }
    }

    // Boundary collisions (canvas boundaries)
    const r = 10; // Radius of particle (same as in canvas)
    const maxX = 1900; // Canvas width
    const maxY = 700; // Canvas height

    for (const p of this.particles) {
      // Left and right boundaries
      if (p.position.x - r < 0) {
        p.position.x = r; // Position particle inside the boundary
        p.velocity.x *= -0.88; // Invert velocity to simulate bounce
      }
      if (p.position.x + r > maxX) {
        p.position.x = maxX - r;
        p.velocity.x *= -0.88; // Apply coefficient of restitution (1)
      }

      // Top and bottom boundaries
      if (p.position.y - r < 0) {
        p.position.y = r;
        p.velocity.y *= -0.88;
      }
      if (p.position.y + r > maxY) {
        p.position.y = maxY - r;
        p.velocity.y *= -0.88;
      }
    }
  }
}
