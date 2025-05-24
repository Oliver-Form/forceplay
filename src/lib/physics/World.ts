import { Particle } from './Particle';
  import { Vector2D } from './VectorFunctions';

  // Coefficient of restitution, default bounce factor between 0 and 1
  // Removed global const e in favor of instance property

  export class World {
    restitution: number;
    useGravity: boolean = true; // gravity enabled flag
    /**
     * Create a new World with given restitution coefficient (0-1)
     */
    constructor(restitution = 0.88) {
      this.restitution = restitution;
    }

    /**
     * Enable or disable gravity.
     */
    setGravityEnabled(value: boolean) {
      this.useGravity = value;
    }

    particles: Particle[] = [];
    slopes: { start: Vector2D; end: Vector2D }[] = [];
    ropes: { start: Particle; end: Particle; length: number }[] = [];

    /**
     * Update restitution coefficient, clamped to [0,1]
     */
    setRestitution(value: number) {
      this.restitution = Math.max(0, Math.min(1, value));
    }

    // Add particle to the world
    addParticle(p: Particle) {
      this.particles.push(p);
    }

    addSlope(start: Vector2D, end: Vector2D) {
      this.slopes.push({ start, end });
    }

    /**
     * Add a rope constraint between two particles, with optional fixed length.
     * If length is not provided, it is computed from current positions.
     */
    addRope(start: Particle, end: Particle, length?: number) {
      let ropeLength: number;
      if (length !== undefined) {
        ropeLength = length;
      } else {
        const dx = end.position.x - start.position.x;
        const dy = end.position.y - start.position.y;
        ropeLength = Math.sqrt(dx * dx + dy * dy);
      }
      this.ropes.push({ start, end, length: ropeLength });
    }

    // Run physics for each step ('time' delta dt)
    step(dt: number) {
      for (const p of this.particles) {
        if (!p.isStationary) {
          // compute net force and integrate without allocations
          const fx = p.appliedForce.x;
          const g = this.useGravity ? 9.8 : 0;
          const fy = p.appliedForce.y - g * p.mass;
          const invM = 1 / p.mass;
          // velocity update: v += (F/m) * dt
          p.velocity.x += fx * invM * dt;
          p.velocity.y += fy * invM * dt;
          // position update: x += v * dt
          p.position.x += p.velocity.x * dt;
          p.position.y += p.velocity.y * dt;
          // Apply energy correction
          p.correctEnergy(g);

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

            // use restitution property for particle collisions
            const e = this.restitution;
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
          p.velocity.x *= -this.restitution;
        }
        if (p.position.x + r > maxX) {
          p.position.x = maxX - r;
          p.velocity.x *= -this.restitution;
        }

        if (p.position.y - r < 0) {
          p.position.y = r;
          p.velocity.y *= -this.restitution;
        }
        if (p.position.y + r > maxY) {
          p.position.y = maxY - r;
          p.velocity.y *= -this.restitution;
        }
      }

      // Apply rope constraints
      for (const rope of this.ropes) {
        const p1 = rope.start;
        const p2 = rope.end;
        const dx = p2.position.x - p1.position.x;
        const dy = p2.position.y - p1.position.y;
        const currentLength = Math.sqrt(dx * dx + dy * dy);
        if (currentLength === 0) continue;
        const nx = dx / currentLength;
        const ny = dy / currentLength;
        const diff = currentLength - rope.length;
        if (diff === 0) continue;
        if (p1.isStationary && !p2.isStationary) {
          p2.position.x -= diff * nx;
          p2.position.y -= diff * ny;
          const relVel = p2.velocity.x * nx + p2.velocity.y * ny;
          p2.velocity.x -= relVel * nx;
          p2.velocity.y -= relVel * ny;
        } else if (!p1.isStationary && p2.isStationary) {
          p1.position.x += diff * nx;
          p1.position.y += diff * ny;
          const relVel = p1.velocity.x * nx + p1.velocity.y * ny;
          p1.velocity.x -= relVel * nx;
          p1.velocity.y -= relVel * ny;
        } else if (!p1.isStationary && !p2.isStationary) {
          const half = diff / 2;
          p1.position.x += half * nx;
          p1.position.y += half * ny;
          p2.position.x -= half * nx;
          p2.position.y -= half * ny;
          const relVel = (p2.velocity.x - p1.velocity.x) * nx + (p2.velocity.y - p1.velocity.y) * ny;
          const impulse = relVel / 2;
          p1.velocity.x += impulse * nx;
          p1.velocity.y += impulse * ny;
          p2.velocity.x -= impulse * nx;
          p2.velocity.y -= impulse * ny;
        }
      }
    }
  }

