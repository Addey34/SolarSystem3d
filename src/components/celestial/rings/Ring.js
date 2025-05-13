import * as THREE from 'three';

export class Ring {
  static LOD_CONFIG = [
    { segments: 128, distance: 100 },
    { segments: 64, distance: 300 },
    { segments: 32, distance: 500 },
  ];

  constructor(textures, config, planetRadius) {
    this.config = config;
    this.textures = textures;
    this.planetRadius = planetRadius;
    this.mesh = this.createRingLOD();
  }

  createRingLOD() {
    const lod = new THREE.LOD();
    const innerRadius = this.config.innerRadius * this.planetRadius;
    const outerRadius = this.config.outerRadius * this.planetRadius;
    Ring.LOD_CONFIG.forEach(({ segments, distance }) => {
      const texture = this.getTextureForDistance(distance);
      if (!texture) return;
      const geometry = new THREE.RingGeometry(
        innerRadius,
        outerRadius,
        segments
      );
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        metalness: 0.3,
        roughness: 0.7,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = Math.PI / 2;
      lod.addLevel(mesh, distance);
    });
    return lod;
  }

  getTextureForDistance(distance) {
    const resolution = this.getBestResolution(distance);
    return this.textures[`${this.config.textures}_${resolution}`];
  }

  getBestResolution(distance) {
    const available = this.config.textureResolutions || ['1k'];
    if (distance < 100) return available.includes('8k') ? '8k' : available[0];
    if (distance < 300) return available.includes('4k') ? '4k' : available[0];
    return available.includes('2k') ? '2k' : available[0];
  }

  update(delta) {
    if (!this.mesh?.levels) return;
    this.mesh.levels.forEach((level) => {
      level.object.rotation.z += delta * this.config.rotationSpeed;
    });
  }

  dispose() {
    if (!this.mesh?.levels) return;
    this.mesh.levels.forEach((level) => {
      level.object.geometry.dispose();
      level.object.material.dispose();
    });
  }
}
