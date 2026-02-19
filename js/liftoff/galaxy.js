/* ==========================================================================
   Liftoff - Galaxy Module
   Distant galaxy background with faded edges
   ========================================================================== */

import * as THREE from 'three';

// Galaxy URL - hosted on GitHub Pages (same pattern as logo in preloader.js)
const GALAXY_URL = 'https://kovardigital.github.io/triglass/assets/images/galaxy.jpg';

let galaxyMesh = null;

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

    // Calculate distance from center (0.5, 0.5)
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(vUv, center);

    // Radial fade: fully visible in center, fades to transparent at edges
    // Start fade at 0.25, fully transparent at 0.5 (edge)
    float fade = 1.0 - smoothstep(0.2, 0.5, dist);

    gl_FragColor = vec4(texColor.rgb, texColor.a * fade * opacity);
  }
`;

function init(worldGroup) {
  const loader = new THREE.TextureLoader();

  console.log('[LIFTOFF] Loading galaxy from:', GALAXY_URL);

  loader.load(
    GALAXY_URL,
    (texture) => {
      // Create shader material with radial fade
      const material = new THREE.ShaderMaterial({
        uniforms: {
          galaxyTexture: { value: texture },
          opacity: { value: 0.7 }  // Overall opacity
        },
        vertexShader: galaxyVertexShader,
        fragmentShader: galaxyFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });

      // Large plane positioned far back (but in front of star reset point)
      const geometry = new THREE.PlaneGeometry(2000, 2000);
      galaxyMesh = new THREE.Mesh(geometry, material);
      galaxyMesh.position.z = -1800;  // Closer than before, behind stars but visible

      worldGroup.add(galaxyMesh);
      console.log('[LIFTOFF] Galaxy loaded and added to scene');
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
  // Optional: very slow rotation for subtle movement
  if (galaxyMesh) {
    galaxyMesh.rotation.z += 0.0001;
  }
}

function destroy() {
  if (galaxyMesh) {
    galaxyMesh.geometry.dispose();
    galaxyMesh.material.dispose();
    galaxyMesh = null;
  }
}

export { init, update, destroy };
