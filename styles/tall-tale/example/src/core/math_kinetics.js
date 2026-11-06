// Advanced Mathematical Kinetics & Higher-Order Dynamics Library
// Implements Gielis Superformula, Runge-Kutta 4th-Order (RK4) Mass-Spring-Damper Physics,
// FABRIK 2-Joint Inverse Kinematics, and Kochanek-Bartels (TCB) Spline Interpolation.

/**
 * Evaluates the Gielis Superformula in polar coordinates:
 * r(theta) = [ |cos(m*theta/4)/a|^n2 + |sin(m*theta/4)/b|^n3 ]^(-1/n1)
 */
export function gielisRadius(theta, a = 1.0, b = 0.94, m = 4, n1 = 2.0, n2 = 2.05, n3 = 1.95) {
  const t1 = Math.abs(Math.cos((m * theta) / 4) / a);
  const t2 = Math.abs(Math.sin((m * theta) / 4) / b);
  const sum = Math.pow(t1, n2) + Math.pow(t2, n3);
  if (sum <= 1e-7) return 0;
  return Math.pow(sum, -1.0 / n1);
}

/**
 * Draws a smooth closed Superformula path onto a 2D CanvasRenderingContext.
 */
export function drawSuperformulaPath(ctx, cx, cy, rx, ry, { a = 1.0, b = 0.94, m = 4, n1 = 2.0, n2 = 2.05, n3 = 1.95, samples = 72 } = {}) {
  ctx.beginPath();
  const dTheta = (Math.PI * 2) / samples;
  for (let i = 0; i <= samples; i++) {
    const theta = i * dTheta;
    const r = gielisRadius(theta, a, b, m, n1, n2, n3);
    const px = cx + rx * r * Math.cos(theta);
    const py = cy + ry * r * Math.sin(theta);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/**
 * 4th-Order Runge-Kutta (RK4) Mass-Spring-Damper Dynamics Solver.
 * Equation of Motion:
 *   x'' + 2*zeta*omega_n*x' + omega_n^2*(x - x_target) = 0
 */
export class RK4Spring {
  constructor({ zeta = 0.62, omega = 18.0, initial = 0.0 } = {}) {
    this.zeta = zeta;          // Damping ratio (0.5-0.7 = organic underdamped rebound)
    this.omega = omega;        // Natural frequency in rad/s
    this.x = initial;          // Current position
    this.v = 0.0;              // Current velocity
    this.target = initial;     // Target driving equilibrium
  }

  setTarget(target) {
    this.target = target;
  }

  snap(val) {
    this.x = val;
    this.target = val;
    this.v = 0.0;
  }

  // Acceleration state derivative
  _acc(x, v) {
    return -2.0 * this.zeta * this.omega * v - (this.omega * this.omega) * (x - this.target);
  }

  /**
   * Advances the physical state by dt seconds using 4th-order Runge-Kutta integration.
   */
  step(dt) {
    if (dt <= 0) return this.x;
    const maxStep = 1.0 / 60.0;
    let rem = dt;
    while (rem > 0) {
      const h = Math.min(rem, maxStep);
      rem -= h;

      // Stage 1
      const k1_v = this.v;
      const k1_a = this._acc(this.x, this.v);

      // Stage 2
      const x2 = this.x + 0.5 * h * k1_v;
      const v2 = this.v + 0.5 * h * k1_a;
      const k2_v = v2;
      const k2_a = this._acc(x2, v2);

      // Stage 3
      const x3 = this.x + 0.5 * h * k2_v;
      const v3 = this.v + 0.5 * h * k2_a;
      const k3_v = v3;
      const k3_a = this._acc(x3, v3);

      // Stage 4
      const x4 = this.x + h * k3_v;
      const v4 = this.v + h * k3_a;
      const k4_v = v4;
      const k4_a = this._acc(x4, v4);

      // RK4 weighted sum
      this.x += (h / 6.0) * (k1_v + 2.0 * k2_v + 2.0 * k3_v + k4_v);
      this.v += (h / 6.0) * (k1_a + 2.0 * k2_a + 2.0 * k3_a + k4_a);
    }
    return this.x;
  }
}

/**
 * 2-Joint Analytical / FABRIK Inverse Kinematics Solver for Arms and Legs.
 * Given root (x0, y0), target (tx, ty), and limb lengths L1, L2:
 * Computes the natural joint bend position (x1, y1) and end effector (x2, y2).
 */
export function solveFABRIK2D(x0, y0, tx, ty, L1, L2, flipElbow = false) {
  const dx = tx - x0, dy = ty - y0;
  const dist = Math.hypot(dx, dy);

  // Case 1: Target unreachable (fully extended)
  if (dist >= L1 + L2) {
    const scale = (L1 + L2) / (dist || 1e-4);
    const fx = x0 + dx * scale, fy = y0 + dy * scale;
    const jx = x0 + dx * (L1 / (dist || 1e-4));
    const jy = y0 + dy * (L1 / (dist || 1e-4));
    return { root: [x0, y0], joint: [jx, jy], end: [fx, fy], reached: false };
  }

  // Case 2: Target inside reach (law of cosines)
  const dClamped = Math.max(dist, Math.abs(L1 - L2) + 1e-4);
  const cosAlpha = (L1 * L1 + dClamped * dClamped - L2 * L2) / (2 * L1 * dClamped);
  const alpha = Math.acos(Math.max(-1.0, Math.min(1.0, cosAlpha)));
  const baseAngle = Math.atan2(dy, dx);
  const elbowAngle = baseAngle + (flipElbow ? -alpha : alpha);

  const jx = x0 + L1 * Math.cos(elbowAngle);
  const jy = y0 + L1 * Math.sin(elbowAngle);

  return { root: [x0, y0], joint: [jx, jy], end: [tx, ty], reached: true };
}

/**
 * Kochanek-Bartels (TCB) Cubic Spline Trajectory Interpolator.
 * T = Tension: tightness of curve (-1 to 1)
 * C = Continuity: smoothness across keyframes (-1 to 1)
 * B = Bias: direction of curve influence (-1 to 1)
 */
export function interpolateTCB(p0, p1, p2, p3, t, { T = 0.2, C = 0.0, B = -0.1 } = {}) {
  // Tangent at P1 (incoming)
  const d1 = 0.5 * (1 - T) * (1 - C) * (1 + B) * (p1 - p0) +
             0.5 * (1 - T) * (1 + C) * (1 - B) * (p2 - p1);

  // Tangent at P2 (outgoing)
  const d2 = 0.5 * (1 - T) * (1 + C) * (1 + B) * (p2 - p1) +
             0.5 * (1 - T) * (1 - C) * (1 - B) * (p3 - p2);

  // Hermite basis polynomials
  const t2 = t * t, t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;

  return h00 * p1 + h10 * d1 + h01 * p2 + h11 * d2;
}

/**
 * Contact Ambient Occlusion and Perspective Shadow Projection.
 * I(h) = I0 * (r0^2 / (r0^2 + h^2))
 */
export function computeContactShadow(baseRadius, heightAboveGround, maxDensity = 0.55) {
  const r0 = baseRadius;
  const h = Math.max(0.0, heightAboveGround);
  const intensity = maxDensity * (r0 * r0) / (r0 * r0 + h * h * 4.0);
  const spreadScale = 1.0 + (h / (r0 * 1.5));
  return { opacity: intensity, scale: spreadScale };
}
