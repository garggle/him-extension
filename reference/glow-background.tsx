'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

// Helper functions for color calculations
const rgbaHexToHex = (rgbaHex: string): string => {
  // Remove alpha channel and any transparency notation
  return rgbaHex.replace(/[0-9a-f]{2}(?!.*[0-9a-f]{2})/i, '');
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse r, g, b values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return { r, g, b };
};

const rgbToHsl = (
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  // Convert to degrees and percentages
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
  const rgb = hexToRgb(hex);
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
};

// Helper function for easing animations
const easeInOut = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// Draw star with multi-layered glow
const drawGlowingStar = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  twinkleFactor: number,
  coreColor: string,
  midColor: string,
  outerColor: string,
  overallAlpha: number = 1.0
) => {
  // Skip rendering stars that are too small to be visible
  if (size < 0.3) return;

  ctx.save();

  // Apply global alpha for overall star brightness
  ctx.globalAlpha = overallAlpha;

  // Apply global composite operation for better blending
  ctx.globalCompositeOperation = 'screen';

  // Combined outer and middle glow into one layer
  const outerSize = size * 4 * (1 + twinkleFactor * 0.4);
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, outerSize);

  // Core (brightest part)
  gradient.addColorStop(0, '#FFFFFF');
  gradient.addColorStop(0.1, coreColor);

  // Mid glow
  gradient.addColorStop(0.2, midColor + '90');
  gradient.addColorStop(0.5, midColor + '40');

  // Outer glow
  gradient.addColorStop(0.7, outerColor + '20');
  gradient.addColorStop(1, outerColor + '00');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, outerSize, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

// Interfaces for nebula and star entities
interface NebulaCloudCore {
  offsetX: number;
  offsetY: number;
  radius: number;
  colorStops: Array<{ offset: number; color: string }>;
  alphaMultiplier: number;
}

interface NebulaCloud {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetVx: number;
  targetVy: number;
  cores: NebulaCloudCore[];
  depth: number;
  directionChangeTime: number;
  directionChangeInterval: number;
  easeAmount: number;
  paletteIndex: number;
  totalRadius: number;
}

interface StarParticle {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  targetVx: number;
  targetVy: number;
  alpha: number;
  directionChangeTime: number;
  directionChangeInterval: number;
  depth: number;
  // Colors for the star layers
  coreColor: string;
  midColor: string;
  outerColor: string;
  // Twinkling effect
  twinkleFactor: number;
  twinkleDirection: number;
  twinkleSpeed: number;
  twinkleMax: number;
}

// Combined type for sorting by depth
type NebulaEntity =
  | (NebulaCloud & { type: 'cloud' })
  | (StarParticle & { type: 'star' });

// Helper function to calculate distance between two points
const calculateDistance = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

// Helper function to check if a new cloud would overlap with existing clouds
const wouldOverlap = (
  x: number,
  y: number,
  totalRadius: number,
  existingClouds: Array<{ x: number; y: number; totalRadius: number }>
): boolean => {
  // Minimum distance multiplier - higher values create more spacing between clouds
  const minDistanceMultiplier = 0.7;

  for (const cloud of existingClouds) {
    const distance = calculateDistance(x, y, cloud.x, cloud.y);
    const minDistance =
      (totalRadius + cloud.totalRadius) * minDistanceMultiplier;

    if (distance < minDistance) {
      return true; // Would overlap
    }
  }

  return false; // No overlap
};

export default function GlowBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dominantNebulaHSL, setDominantNebulaHSL] = useState<string | null>(
    null
  );
  // Add state to track client-side mounting
  const [isClientMounted, setIsClientMounted] = useState(false);

  // First useEffect: Setup canvas and detect client mount
  useEffect(() => {
    // Set client mounted state to true
    setIsClientMounted(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);

    // Clean up
    return () => {
      window.removeEventListener('resize', setCanvasDimensions);
    };
  }, []);

  // Second useEffect: Initialize and animate only after client mount
  useEffect(() => {
    // Only run on client after mounting
    if (!isClientMounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Detect if we're on a mobile device
    const MOBILE_BREAKPOINT = 768;
    const isMobile = canvas.width < MOBILE_BREAKPOINT;

    // Star color palettes matching the theme
    const starPalettes = [
      // Each palette has core, middle, and outer glow colors
      {
        core: '#ffd6f6',
        mid: '#DD459C',
        outer: '#7945A5',
      },
      {
        core: '#E8A3C4',
        mid: '#B768A2',
        outer: '#7945A5',
      },
      {
        core: '#ffd6f6',
        mid: '#9370DB',
        outer: '#7945A5',
      },
      {
        core: '#E0B0FF',
        mid: '#8A2BE2',
        outer: '#7945A5',
      },
    ];

    // Nebula color palette definitions
    const nebulaPalettes = [
      // Hydrogen Alpha (red/pink)
      [
        { offset: 0, color: '#FFA0A060' },
        { offset: 0.4, color: '#C0404030' },
        { offset: 1, color: '#80000000' },
      ],
      // Mixed (purple/violet)
      [
        { offset: 0, color: '#D0A0F050' },
        { offset: 0.5, color: '#8040C020' },
        { offset: 1, color: '#40008000' },
      ],
      // Pink/magenta
      [
        { offset: 0, color: '#FF80E050' },
        { offset: 0.5, color: '#D040A020' },
        { offset: 1, color: '#80004000' },
      ],
    ];

    // Create nebula clouds with palette tracking and overlap avoidance
    const nebulaCloudCount = Math.min(
      6,
      Math.max(4, Math.floor((canvas.width * canvas.height) / 800000))
    );

    const nebulaClouds: NebulaCloud[] = [];
    const placedClouds: Array<{ x: number; y: number; totalRadius: number }> =
      [];

    // Try to place each cloud without overlaps
    for (let i = 0; i < nebulaCloudCount; i++) {
      let attempts = 0;
      let cloud: NebulaCloud | null = null;

      // Try up to 20 times to place a cloud without overlap
      while (attempts < 20 && cloud === null) {
        attempts++;

        // Generate positions more centered in the canvas
        // Use 20% to 80% of the canvas dimensions for a wider distribution
        const x = canvas.width * (0.2 + Math.random() * 0.6);
        const y = canvas.height * (0.2 + Math.random() * 0.6);
        const depth = 0.5 + Math.random();
        const coreCount = 3 + Math.floor(Math.random() * 4);
        const baseCoreRadius =
          canvas.width < 768
            ? 150 + Math.random() * 150 // Reduced from 225 + 200 to 150 + 150 for mobile
            : 350 + Math.random() * 250; // Reduced from 450 + 350 to 350 + 250 for desktop

        // Choose palette index
        const paletteIndex = Math.floor(Math.random() * nebulaPalettes.length);
        const palette = nebulaPalettes[paletteIndex];

        let totalRadius = 0;
        let maxDistanceFromCenter = 0;

        const cores: NebulaCloudCore[] = Array.from(
          { length: coreCount },
          (_, index) => {
            // Increase minimum radius factor from 0.6 to 0.8
            const radius = baseCoreRadius * (0.8 + Math.random() * 0.6);

            // More structured pseudorandom placement using index
            // Divide the circle into sections based on core count
            const angle =
              (index / coreCount) * Math.PI * 2 + (Math.random() * 0.5 - 0.25);
            const distance = baseCoreRadius * (0.2 + Math.random() * 0.3);

            // Track the maximum distance from center plus core radius
            const distanceFromCenter = Math.sqrt(
              Math.pow(Math.cos(angle) * distance, 2) +
                Math.pow(Math.sin(angle) * distance, 2)
            );
            maxDistanceFromCenter = Math.max(
              maxDistanceFromCenter,
              distanceFromCenter + radius
            );

            return {
              // Use angle-based positioning for more even distribution
              offsetX: Math.cos(angle) * distance,
              offsetY: Math.sin(angle) * distance,
              radius,
              colorStops: [...palette],
              alphaMultiplier: 0.4 + Math.random() * 0.4,
            };
          }
        );

        // Use the maximum distance from center plus radius as the total radius
        totalRadius = maxDistanceFromCenter;

        // Check if this cloud would overlap with existing clouds
        if (!wouldOverlap(x, y, totalRadius, placedClouds)) {
          cloud = {
            x,
            y,
            vx: (Math.random() - 0.5) * 0.25,
            vy: (Math.random() - 0.5) * 0.25,
            targetVx: (Math.random() - 0.5) * 0.4,
            targetVy: (Math.random() - 0.5) * 0.4,
            cores,
            depth,
            directionChangeTime: Math.random() * 6000,
            directionChangeInterval: 4000 + Math.random() * 6000,
            easeAmount: 0,
            paletteIndex,
            totalRadius,
          };

          // Add to placed clouds for future overlap checking
          placedClouds.push({ x, y, totalRadius });
        }
      }

      // If we couldn't place a cloud after max attempts, create one anyway but at a random position
      if (cloud === null) {
        const x = canvas.width * Math.random();
        const y = canvas.height * Math.random();
        const depth = 0.5 + Math.random();
        const coreCount = 3 + Math.floor(Math.random() * 4);
        const baseCoreRadius =
          canvas.width < 768
            ? 150 + Math.random() * 150 // Reduced for mobile
            : 350 + Math.random() * 250; // Reduced for desktop

        // Choose palette index
        const paletteIndex = Math.floor(Math.random() * nebulaPalettes.length);
        const palette = nebulaPalettes[paletteIndex];

        let totalRadius = 0;
        let maxDistanceFromCenter = 0;

        const cores: NebulaCloudCore[] = Array.from(
          { length: coreCount },
          (_, index) => {
            const radius = baseCoreRadius * (0.8 + Math.random() * 0.6);

            const angle =
              (index / coreCount) * Math.PI * 2 + (Math.random() * 0.5 - 0.25);
            const distance = baseCoreRadius * (0.2 + Math.random() * 0.3);

            // Track the maximum distance from center plus core radius
            const distanceFromCenter = Math.sqrt(
              Math.pow(Math.cos(angle) * distance, 2) +
                Math.pow(Math.sin(angle) * distance, 2)
            );
            maxDistanceFromCenter = Math.max(
              maxDistanceFromCenter,
              distanceFromCenter + radius
            );

            return {
              offsetX: Math.cos(angle) * distance,
              offsetY: Math.sin(angle) * distance,
              radius,
              colorStops: [...palette],
              alphaMultiplier: 0.4 + Math.random() * 0.4,
            };
          }
        );

        // Use the maximum distance from center plus radius as the total radius
        totalRadius = maxDistanceFromCenter;

        cloud = {
          x,
          y,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          targetVx: (Math.random() - 0.5) * 0.4,
          targetVy: (Math.random() - 0.5) * 0.4,
          cores,
          depth,
          directionChangeTime: Math.random() * 6000,
          directionChangeInterval: 4000 + Math.random() * 6000,
          easeAmount: 0,
          paletteIndex,
          totalRadius,
        };

        placedClouds.push({ x, y, totalRadius });
      }

      nebulaClouds.push(cloud);
    }

    // Calculate dominant color based on nebula cloud sizes and palette frequency
    const calculateDominantColor = () => {
      const paletteWeights = new Array(nebulaPalettes.length).fill(0);

      // Weight each palette by the total radius of clouds using it
      nebulaClouds.forEach((cloud) => {
        paletteWeights[cloud.paletteIndex] += cloud.totalRadius * cloud.depth;
      });

      // Find the dominant palette index
      const dominantPaletteIndex = paletteWeights.reduce(
        (maxIndex, weight, index) =>
          weight > paletteWeights[maxIndex] ? index : maxIndex,
        0
      );

      // Get the representative color from the dominant palette (using the middle color stop)
      const dominantPalette = nebulaPalettes[dominantPaletteIndex];
      const representativeColor = dominantPalette[1].color; // Use the middle color stop

      // Convert RGBA hex to regular hex, then to HSL
      const hex = rgbaHexToHex(representativeColor);
      const hsl = hexToHsl(hex);

      // Format HSL string and update state
      setDominantNebulaHSL(`${hsl.h} ${hsl.s}% ${hsl.l}%`);
    };

    // Calculate initial dominant color
    calculateDominantColor();

    // Create star particles (adjusted for mobile)
    const particleCount = isMobile
      ? Math.max(
          40, // Reduced base count for mobile
          Math.floor((canvas.width * canvas.height) / 100000) // Reduced density for mobile
        )
      : 80; // Fixed count for desktop

    const starParticles: StarParticle[] = Array.from(
      { length: particleCount },
      () => {
        // Get a random color palette
        const palette =
          starPalettes[Math.floor(Math.random() * starPalettes.length)];
        const size = 0.3 + Math.random() * 1.0; // Small, star-like sizes
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          targetVx: (Math.random() - 0.5) * 0.3, // Initialize with non-zero values
          targetVy: (Math.random() - 0.5) * 0.3, // Initialize with non-zero values
          alpha: 0.5 + Math.random() * 0.5,
          directionChangeTime: Math.random() * 5000, // Randomize initial time
          directionChangeInterval: Math.random() * 5000 + 5000,
          depth: 0.1 + Math.random() * 1.9, // Full range of depths
          // Colors for the three layers
          coreColor: palette.core,
          midColor: palette.mid,
          outerColor: palette.outer,
          // Twinkling effect
          twinkleFactor: 0,
          twinkleDirection: Math.random() > 0.5 ? 1 : -1,
          twinkleSpeed: 0.001 + Math.random() * 0.002, // Slower twinkling
          twinkleMax: 0.2 + Math.random() * 0.3, // Reduced maximum
        };
      }
    );

    // Function to draw a nebula cloud
    const drawNebulaCloud = (
      cloud: NebulaCloud,
      ctx: CanvasRenderingContext2D
    ) => {
      ctx.save();

      // Set blend mode for additive blending of cloud colors
      ctx.globalCompositeOperation = 'lighter';

      // Draw each core of the cloud
      cloud.cores.forEach((core) => {
        // Calculate absolute position
        const absX = cloud.x + core.offsetX;
        const absY = cloud.y + core.offsetY;

        // Create gradient from the core's color stops
        const gradient = ctx.createRadialGradient(
          absX,
          absY,
          0,
          absX,
          absY,
          core.radius * cloud.depth
        );

        // Apply all color stops
        core.colorStops.forEach((stop) => {
          gradient.addColorStop(stop.offset, stop.color);
        });

        // Set alpha and draw
        ctx.globalAlpha = core.alphaMultiplier;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(absX, absY, core.radius * cloud.depth, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    };

    let lastTime = 0;
    let frameSkip = 0;

    // Animation loop
    const animate = (time: number) => {
      // Calculate delta time
      const deltaTime = time - lastTime;
      lastTime = time;

      // Detect very slow framerates and apply additional optimizations
      const fps = 1000 / deltaTime;
      const isLowFPS = fps < 30;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Frame skipping for performance
      frameSkip = (frameSkip + 1) % (isLowFPS ? 3 : 1);
      const shouldUpdateMovement = frameSkip === 0;

      // Update nebula cloud positions
      if (shouldUpdateMovement) {
        nebulaClouds.forEach((cloud) => {
          // Update direction change timer
          cloud.directionChangeTime += deltaTime;

          if (cloud.directionChangeTime > cloud.directionChangeInterval) {
            cloud.directionChangeTime = 0;
            cloud.directionChangeInterval = Math.random() * 6000 + 4000; // Decreased from 8000+6000 to 6000+4000

            // Set new target velocities (faster)
            cloud.targetVx = (Math.random() - 0.5) * 0.4; // Increased from 0.25 to 0.4
            cloud.targetVy = (Math.random() - 0.5) * 0.4; // Increased from 0.25 to 0.4

            // Reset easing animation
            cloud.easeAmount = 0;
          }

          // Progress the ease amount
          cloud.easeAmount = Math.min(1, cloud.easeAmount + deltaTime / 800); // Decreased from 1000 to 800

          // Apply easing to velocity changes
          const easeValue = easeInOut(cloud.easeAmount);
          cloud.vx += (cloud.targetVx - cloud.vx) * easeValue * 0.02; // Increased from 0.01 to 0.02
          cloud.vy += (cloud.targetVy - cloud.vy) * easeValue * 0.02; // Increased from 0.01 to 0.02

          // Move cloud
          cloud.x += cloud.vx * deltaTime * 0.15; // Increased from 0.1 to 0.15
          cloud.y += cloud.vy * deltaTime * 0.15; // Increased from 0.1 to 0.15

          // Wrap at screen edges
          const maxRadius = Math.max(...cloud.cores.map((c) => c.radius));
          if (cloud.x < -maxRadius * 1.5)
            cloud.x = canvas.width + maxRadius * 0.5;
          if (cloud.x > canvas.width + maxRadius * 1.5)
            cloud.x = -maxRadius * 0.5;
          if (cloud.y < -maxRadius * 1.5)
            cloud.y = canvas.height + maxRadius * 0.5;
          if (cloud.y > canvas.height + maxRadius * 1.5)
            cloud.y = -maxRadius * 0.5;
        });
      }

      // Update star particles
      if (shouldUpdateMovement) {
        starParticles.forEach((particle) => {
          // Update direction change timer
          particle.directionChangeTime += deltaTime;

          if (particle.directionChangeTime > particle.directionChangeInterval) {
            particle.directionChangeTime = 0;
            particle.directionChangeInterval = Math.random() * 5000 + 5000;

            // Set new target velocities
            particle.targetVx = (Math.random() - 0.5) * 0.3; // Increased from 0.15 to 0.3
            particle.targetVy = (Math.random() - 0.5) * 0.3; // Increased from 0.15 to 0.3
          }

          // Ease toward target velocity
          particle.vx += (particle.targetVx - particle.vx) * 0.02; // Increased from 0.01 to 0.02
          particle.vy += (particle.targetVy - particle.vy) * 0.02; // Increased from 0.01 to 0.02

          // Move particle
          particle.x += particle.vx * deltaTime * 0.1; // Increased from 0.05 to 0.1
          particle.y += particle.vy * deltaTime * 0.1; // Increased from 0.05 to 0.1

          // Twinkling effect - slower and more subtle
          particle.twinkleFactor +=
            particle.twinkleDirection *
            particle.twinkleSpeed *
            deltaTime *
            0.05;
          if (particle.twinkleFactor > particle.twinkleMax)
            particle.twinkleDirection = -1;
          if (particle.twinkleFactor < 0) particle.twinkleDirection = 1;

          // Wrap around screen edges
          if (particle.x < -20) particle.x = canvas.width + 20;
          if (particle.x > canvas.width + 20) particle.x = -20;
          if (particle.y < -20) particle.y = canvas.height + 20;
          if (particle.y > canvas.height + 20) particle.y = -20;
        });
      }

      // Create combined entity array for depth sorting
      const combinedEntities: NebulaEntity[] = [
        ...nebulaClouds.map((cloud) => ({ ...cloud, type: 'cloud' as const })),
        ...starParticles.map((star) => ({ ...star, type: 'star' as const })),
      ];

      // Sort by depth (ascending, so deeper objects are drawn first)
      combinedEntities.sort((a, b) => a.depth - b.depth);

      // Draw all entities in depth order
      combinedEntities.forEach((entity) => {
        if (entity.type === 'cloud') {
          drawNebulaCloud(entity, ctx);
        } else {
          // It's a star
          drawGlowingStar(
            ctx,
            entity.x,
            entity.y,
            entity.size * (entity.depth * 0.7 + 0.3), // Scale by depth somewhat
            entity.twinkleFactor,
            entity.coreColor,
            entity.midColor,
            entity.outerColor,
            entity.alpha * (entity.depth * 0.5 + 0.5) // Alpha also affected by depth
          );
        }
      });

      requestAnimationFrame(animate);
    };

    // Start the animation
    const animationId = requestAnimationFrame(animate);

    // Clean up
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isClientMounted]); // This effect depends on isClientMounted

  // Effect to update CSS variables when dominant color changes
  useEffect(() => {
    if (!dominantNebulaHSL) return;

    // Parse HSL values
    const [h, s, l] = dominantNebulaHSL.split(' ').map((v) => parseInt(v));

    // Set the primary color variables
    document.documentElement.style.setProperty('--primary', dominantNebulaHSL);
    document.documentElement.style.setProperty('--primary-hue', h.toString());
    document.documentElement.style.setProperty('--primary-saturation', s + '%');

    // Set foreground with high lightness
    const foregroundHSL = `${h} ${s}% 99%`;
    document.documentElement.style.setProperty('--foreground', foregroundHSL);
    document.documentElement.style.setProperty(
      '--primary-foreground',
      foregroundHSL
    );
  }, [dominantNebulaHSL]);

  return (
    <motion.canvas
      ref={canvasRef}
      className="fixed inset-0 -z-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    />
  );
}
