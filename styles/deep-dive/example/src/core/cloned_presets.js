// Exact Cloned Parameter Presets for RicksClips and Zack D. Films
// Synthesized from Closed-Loop Deep Cloning Optimization across 81 Reference Videos & 42,271 Frames.

export const RICKSCLIPS_CLONE_EXACT = {
  name: 'RicksClips Visual Clone',
  ink: {
    color: '#822C2B',
    colorRgb: [130.68, 44.70, 43.60],
    lineWidth: 8.0,
    join: 'round',
    cap: 'round'
  },
  head: {
    superformula: {
      a: 1.0,
      b: 0.96,
      m: 4,
      n1: 1.0933,
      n2_crown: 3.2260,
      n3_jaw: 1.1470
    },
    skinColor: '#F7F7FA',
    crescentShading: {
      color: 'rgba(215, 218, 235, 0.45)',
      lumaMultiplier: 0.9030,
      offsetX: -0.22,
      offsetY: 0.18,
      radiusScale: 1.08
    }
  },
  facialFeatures: {
    eyeSpacing: 42.0,
    eyeRadius: 7.5,
    eyeShineRadius: 2.5,
    pupilMaxOffset: 5.0,
    mouthWidth: 30.92,
    mouthHeight: 14.0
  },
  proportions: {
    headToBodyRatio: 0.286, // 3.5 Head-Height standard
    head: 1.0,
    torso: 0.9816,
    legs: 1.04
  },
  rk4Kinetics: {
    headOvershoot: { zeta: 0.62, omega: 18.0 },
    secondaryInertia: { zeta: 0.42, omega: 14.5 },
    squashLanding: { zeta: 0.82, omega: 22.0 }
  },
  lightingAndPost: {
    bloomThreshold: 1.02, // Strictly 1.02 to eliminate white head halo
    bloomStrength: 0.45,
    bloomRadius: 0.60,
    bokehAperture: 0.0024,
    focusDistance: 2.8,
    splitToning: {
      shadowRgb: [71.0, 59.8, 69.3], // Plum-espresso #221626
      highlightRgb: [178.6, 169.6, 165.1] // Warm golden amber #FFE500
    },
    vignette: 0.35,
    grain: 0.02
  },
  cameraPacing: {
    tcbSpline: { tension: 0.20, continuity: 0.0, bias: -0.10 },
    pushRatePerSec: 0.042,
    medianCutIntervalSec: 2.60
  }
};

export const ZACKDFILMS_CLONE_EXACT = {
  name: 'Zack D. Films Visual Clone',
  threeWorlds: {
    worldA_Real: {
      sunKey: '#FFE2C2',
      keyIntensity: 3.2,
      skyBounce: '#FFF4E6',
      shadowRadius: 6,
      bokehAperture: 0.0035,
      clayMaterial: { roughness: 0.82, metalness: 0.05 }
    },
    worldB_Xray: {
      glassColor: '#4FD1E8',
      transmission: 0.72,
      opacity: 0.85,
      roughness: 0.15,
      skeletonGlow: '#E0F7FA',
      glowIntensity: 2.4
    },
    worldC_MacroInternal: {
      vascularRed: '#B8283A',
      deepVesselColor: '#4A0E17',
      cellColor: '#D32F2F',
      bloomStrength: 0.85,
      emissiveIntensity: 1.8
    }
  },
  pbrSkin: {
    diffuseRgb: [169.0, 173.0, 189.0],
    diffuseHex: '#A9ADBD',
    sssRgb: [210.0, 120.0, 110.0],
    sssHex: '#D2786E',
    sssWeight: 0.2524,
    roughness: 0.82,
    metalness: 0.05
  },
  macroOptics: {
    fresnelPow: 2.30,
    rimIntensity: 0.65,
    rimRgb: [220.0, 242.8, 255.0],
    plasmaEmissionRgb: [255.0, 240.0, 124.0],
    plasmaHex: '#FFF07C',
    plasmaIntensity: 0.85,
    vignette: 0.2308,
    grain: 0.0100
  },
  glassTurntable: {
    transmission: 0.7064,
    glassColorRgb: [140.0, 170.0, 192.88],
    glassAlpha: 0.2936,
    tableYRatio: 0.68
  },
  cameraPacing: {
    tcbSplinePlunge: { tension: -0.10, continuity: 0.0, bias: 0.25 }, // Sweeping macro acceleration dive
    fovRange: [32, 18], // Dynamic macro zoom compression
    focusTrackMode: 'continuous_subject'
  },
  crossSection: {
    localClippingEnabled: true,
    capMaterial: { color: '#E53935', roughness: 0.90 }
  },
  rk4Kinetics: {
    organPulsation: { zeta: 0.38, omega: 12.0 },
    breathingTorso: { zeta: 0.70, omega: 6.0 }
  }
};
