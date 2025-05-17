import * as THREE from 'three';

export function createStarfield(texture, options = {}) {
  const { size = 10000 } = options;

  const geometry = new THREE.SphereGeometry(size, 128, 128);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
    fog: false,
  });

  const skybox = new THREE.Mesh(geometry, material);
  skybox.name = 'starfield_skybox';
  skybox.renderOrder = -Infinity;

  return skybox;
}
