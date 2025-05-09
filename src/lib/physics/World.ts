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
      const gravity = new Vector2D(0, 9.81 * p.mass);  // F = m * g
      p.applyForce(gravity);

      // Update the particle's position and velocity
      p.update(dt);

      // Boundary collisions (canvas boundaries)
      const r = 10; // Radius of particle (same as in canvas)
      const maxX = 1900; // Canvas width
      const maxY = 800;  // Canvas height

      // Left and right boundaries
      if (p.position.x - r < 0) {
        p.position.x = r;  // Position particle inside the boundary
        p.velocity.x *= -0.88; // Invert velocity to simulate bounce
      }
      if (p.position.x + r > maxX) {
        p.position.x = maxX - r;
        p.velocity.x *= -0.88; // Apply coefficient of restitution (0.3)
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
