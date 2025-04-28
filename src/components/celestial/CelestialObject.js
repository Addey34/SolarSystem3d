import * as THREE from 'three';
import { CelestialObjectLOD } from './CelestialObjectLOD.js';
import { Ring } from './rings/Ring.js';

export class CelestialObject {
  constructor(textures, config, name) {
    this.name = name;
    this.config = config;
    this.textures = textures;
    this.group = new THREE.Group();
    this.group.name = name;
    this.init();
  }

  init() {
    this.createVisuals();
    this.createRings();
  }

  createVisuals() {
    this.lodSystem = new CelestialObjectLOD(this.name, this.textures, {
      radius: this.config.radius,
      rotationSpeed: this.config.rotationSpeed,
    });
    this.group.add(this.lodSystem.lod);
  }

  createRings() {
    this.ring = [];
    if (!this.config.ring) return;

    this.ring = Object.values(this.config.ring).map((ringConfig) => {
      const ring = new Ring(this.textures, ringConfig, this.config.radius);
      this.group.add(ring.mesh);
      return ring;
    });
  }

  dispose() {
    this.lodSystem?.dispose();
    this.ring.forEach((ring) => {
      ring.dispose();
      this.group.remove(ring.mesh);
    });
    this.group.remove(...this.group.children);
  }
}
