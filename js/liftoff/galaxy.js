/* ==========================================================================
   Liftoff - Galaxy Module
   Distant galaxy background with faded edges
   ========================================================================== */

import * as THREE from 'three';
import { camera } from './core.js';

// Galaxy URL - hosted on GitHub Pages (same pattern as logo in preloader.js)
const GALAXY_URL = 'https://kovardigital.github.io/triglass/assets/images/galaxy.jpg';

let galaxyMesh = null;
let worldGroupRef = null;

// Fixed offset from camera (no depth movement as you scroll)
const GALAXY_OFFSET = { x: -1200, y: 600, z: -2500 };

// Custom shader for radial edge fade
const galaxyVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const galaxyFragmentShader = `
  uniform sampler2D galaxyTexture;
  uniform float opacity;
  varying vec2 vUv;

  void main() {
    vec4 texColor = texture2D(galaxyTexture, vUv);

    // Sharpen and brighten the image
    vec3 color = texColor.rgb;
    color = (color - 0.5) * 1.4 + 0.5;  // Increase contrast
    color *= 1.3;  // Brighten
    color = clamp(color, 0.0, 1.0);

    // Calculate distance from center (0.5, 0.5)
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(vUv, center);

    // Radial fade: fully visible in center, sharper fade at edges
    float fade = 1.0 - smoothstep(0.35, 0.5, dist);

    gl_FragColor = vec4(color, texColor.a * fade * opacity);
  }
`;

function init(worldGroup) {
  worldGroupRef = worldGroup;
  const loader = new THREE.TextureLoader();

  console.log('[LIFTOFF] Loading galaxy from:', GALAXY_URL);

  loader.load(
    GALAXY_URL,
    (texture) => {
      // Create shader material with radial fade
      const material = new THREE.ShaderMaterial({
        uniforms: {
          galaxyTexture: { value: texture },
          opacity: { value: 0.5 }  // Overall opacity
        },
        vertexShader: galaxyVertexShader,
        fragmentShader: galaxyFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });

      // Plane - added to worldGroup for mouse parallax
      const geometry = new THREE.PlaneGeometry(3200, 3200);
      galaxyMesh = new THREE.Mesh(geometry, material);

      // Add to worldGroup (gets mouse parallax rotation)
      worldGroup.add(galaxyMesh);

      // Initial position - Z synced with camera in update()
      galaxyMesh.position.set(
        GALAXY_OFFSET.x,
        GALAXY_OFFSET.y,
        camera.position.z + GALAXY_OFFSET.z
      );
      console.log('[LIFTOFF] Galaxy loaded with parallax, z offset:', GALAXY_OFFSET.z);
    },
    (progress) => {
      console.log('[LIFTOFF] Galaxy loading...', Math.round((progress.loaded / progress.total) * 100) + '%');
    },
    (error) => {
      console.error('[LIFTOFF] Failed to load galaxy texture:', GALAXY_URL, error);
    }
  );
}

function update() {
  if (galaxyMesh) {
    // Sync Z position with camera so galaxy has no depth movement
    galaxyMesh.position.z = camera.position.z + GALAXY_OFFSET.z;

    // Very slow rotation for subtle movement
    galaxyMesh.rotation.z += 0.0001;
  }
}

function destroy() {
  if (galaxyMesh && worldGroupRef) {
    worldGroupRef.remove(galaxyMesh);
    galaxyMesh.geometry.dispose();
    galaxyMesh.material.dispose();
    galaxyMesh = null;
  }
}

export { init, update, destroy };
