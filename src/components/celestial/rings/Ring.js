import * as THREE from 'three';

// Ring.js
export class Ring {
  constructor(textures, config, planetRadius) {
    this.config = config;
    this.ringGeometry = new THREE.RingGeometry(
      config.innerRadius * planetRadius,
      config.outerRadius * planetRadius,
      64
    );

    this.ringMaterial = new THREE.MeshPhongMaterial({
      map: textures[`${config.textures}_${config.textureResolutions[0]}`],
      side: THREE.DoubleSide,
      transparent: true,
    });

    this.mesh = new THREE.Mesh(this.ringGeometry, this.ringMaterial);
    this.mesh.rotation.x = Math.PI / 2;
  }

  update(delta) {
    this.mesh.rotation.z += delta * this.config.rotationSpeed;
  }

  dispose() {
    this.ringGeometry.dispose();
    this.ringMaterial.dispose();
  }
}
