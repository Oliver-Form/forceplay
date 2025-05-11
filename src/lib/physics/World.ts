import { Particle } from './Particle';
import { Vector2D } from './Vector2D';

export class World {
  particles: Particle[] = [];
  slopes: { start: Vector2D; end: Vector2D }[] = [];

  // Add particle to the world
  addParticle(p: Particle) {
    this.particles.push(p);
  }

  addSlope(start: Vector2D, end: Vector2D) {
    this.slopes.push({ start, end });
  }

  // Run physics for each step ('time' delta dt)
  step(dt: number) {
    for (const p of this.particles) {
      if (!p.isStationary) {
        const gravity = new Vector2D(0, -9.8 * p.mass);
        const netForce = gravity.add(p.appliedForce);
        const acceleration = netForce.scale(1 / p.mass);
        p.velocity = p.velocity.add(acceleration.scale(dt));
        p.position = p.position.add(p.velocity.scale(dt));

        // Apply energy correction
        p.correctEnergy(9.8);

        // Check for collisions with slopes
        for (const slope of this.slopes) {
          const dx = slope.end.x - slope.start.x;
          const dy = slope.end.y - slope.start.y;
          const lengthSquared = dx * dx + dy * dy;

          if (lengthSquared === 0) continue; // Skip degenerate slopes

          const t = ((p.position.x - slope.start.x) * dx + (p.position.y - slope.start.y) * dy) / lengthSquared;
          const clampedT = Math.max(0, Math.min(1, t));

          const closestX = slope.start.x + clampedT * dx;
          const closestY = slope.start.y + clampedT * dy;

          const distanceSquared = (p.position.x - closestX) ** 2 + (p.position.y - closestY) ** 2;
          const radiusSquared = 10 ** 2; // Particle radius squared

          if (distanceSquared < radiusSquared) {
            const normalX = p.position.x - closestX;
            const normalY = p.position.y - closestY;
            const normalLength = Math.sqrt(normalX * normalX + normalY * normalY);

            if (normalLength === 0) continue; // Skip if normal is zero

            const nx = normalX / normalLength;
            const ny = normalY / normalLength;

            const relativeVelocityX = p.velocity.x;
            const relativeVelocityY = p.velocity.y;
            const dotProduct = relativeVelocityX * nx + relativeVelocityY * ny;

            if (dotProduct < 0) {
              const restitution = 0.8; // Coefficient of restitution
              const impulse = -(1 + restitution) * dotProduct;

              p.velocity.x += impulse * nx;
              p.velocity.y += impulse * ny;

              // Resolve overlap
              const overlap = 10 - Math.sqrt(distanceSquared);
              p.position.x += overlap * nx;
              p.position.y += overlap * ny;
            }
          }
        }
      }
    }

    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];

        const dx = p2.position.x - p1.position.x;
        const dy = p2.position.y - p1.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = 20;

        if (distance < minDistance) {
          const overlap = minDistance - distance;
          const nx = dx / distance;
          const ny = dy / distance;

          if (!p1.isStationary) {
            p1.position.x -= (overlap / 2) * nx;
            p1.position.y -= (overlap / 2) * ny;
          }
          if (!p2.isStationary) {
            p2.position.x += (overlap / 2) * nx;
            p2.position.y += (overlap / 2) * ny;
          }

          const relativeVelocityX = p2.velocity.x - p1.velocity.x;
          const relativeVelocityY = p2.velocity.y - p1.velocity.y;
          const dotProduct = relativeVelocityX * nx + relativeVelocityY * ny;

          if (dotProduct > 0) {
            continue;
          }

          const e = 1;
          const mass1 = p1.isStationary ? Infinity : p1.mass;
          const mass2 = p2.isStationary ? Infinity : p2.mass;
          const impulse = (-(1 + e) * dotProduct) / (1 / mass1 + 1 / mass2);

          const impulseX = impulse * nx;
          const impulseY = impulse * ny;

          if (!p1.isStationary) {
            p1.velocity.x -= impulseX / p1.mass;
            p1.velocity.y -= impulseY / p1.mass;
          }
          if (!p2.isStationary) {
            p2.velocity.x += impulseX / p2.mass;
            p2.velocity.y += impulseY / p2.mass;
          }
        }
      }
    }

    const r = 10;
    const maxX = 1900;
    const maxY = 700;

    for (const p of this.particles) {
      if (p.position.x - r < 0) {
        p.position.x = r;
        p.velocity.x *= -0.88;
      }
      if (p.position.x + r > maxX) {
        p.position.x = maxX - r;
        p.velocity.x *= -0.88;
      }

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