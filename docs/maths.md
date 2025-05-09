# Mathematical Foundations of the Project

This document provides an in-depth expl provides an in-depth explanation of the mathematical principles and operations used in the project.

## 1. Vector Operations

The `Vector2D` class implements basic 2D vector operations:

### Addition
Given two vectors \( \mathbf{v_1} = (x_1, y_1) \) and \( \mathbf{v_2} = (x_2, y_2) \), their sum is:
\[
\mathbf{v_1} + \mathbf{v_2} = (x_1 + x_2, y_1 + y_2)
\]
This is implemented in the `add` method of the `Vector2D` class.

### Scaling
Scaling a vector \( \mathbf{v} = (x, y) \) by a scalar \( s \) results in:
\[
s \cdot \mathbf{v} = (s \cdot x, s \cdot y)
\]
This is implemented in the `scale` method of the `Vector2D` class.

## 2. Particle Dynamics

The `Particle` class models a particle with position, velocity, and mass. The dynamics are governed by Newton's Second Law:
\[
\mathbf{F} = m \cdot \mathbf{a}
\]
Where:
- \( \mathbf{F} \) is the net force acting on the particle.
- \( m \) is the mass of the particle.
- \( \mathbf{a} \) is the acceleration.

### Force Accumulation
Forces are accumulated in the `forces` array. The net force is computed as:
\[
\mathbf{F}_{\text{net}} = \sum_{i} \mathbf{F}_i
\]

### Position and Velocity Update
The particle's velocity and position are updated using the equations of motion:
\[
\mathbf{a} = \frac{\mathbf{F}_{\text{net}}}{m}
\]
\[
\mathbf{v} = \mathbf{v} + \mathbf{a} \cdot \Delta t
\]
\[
\mathbf{p} = \mathbf{p} + \mathbf{v} \cdot \Delta t
\]
Where \( \Delta t \) is the time step.

## 3. World Physics

The `World` class manages multiple particles and applies global forces like gravity. Gravity is modeled as:
\[
\mathbf{F}_{\text{gravity}} = m \cdot \mathbf{g}
\]
Where \( \mathbf{g} = (0, 9.81) \) m/s² is the gravitational acceleration.

### Boundary Collisions
Particles are constrained within a rectangular boundary (e.g., a canvas). Collisions with boundaries are handled by inverting the velocity component and applying a coefficient of restitution (e.g., 0.88):
\[
\mathbf{v}_{\text{new}} = -e \cdot \mathbf{v}_{\text{old}}
\]
Where \( e \) is the coefficient of restitution.

## 4. Simulation

The simulation updates particle states in discrete time steps. Each step involves:
1. Applying forces (e.g., gravity).
2. Updating positions and velocities.
3. Handling collisions.

This approach ensures realistic motion and interactions within the simulated environment.