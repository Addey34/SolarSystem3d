import * as THREE from 'three';
import { CelestialObjectLOD } from './CelestialObjectLOD.js';

export class CelestialObject {
  constructor(textures, config, name) {
    this.name = name;
    this.config = config;
    this.textures = textures;
    this.group = this.createMainGroup();
    this.initSpecificFeatures();
  }

  createMainGroup() {
    const group = new THREE.Group();
    group.name = this.name;
    group.userData = {
      config: this.config,
      type: 'celestial-body',
      radius: this.config.radius,
    };
    this.lodSystem = new CelestialObjectLOD(this.name, this.textures, {
      radius: this.config.radius,
      rotationSpeed: this.config.rotationSpeed,
    });
    group.add(this.lodSystem.lod);
    return group;
  }

  initSpecificFeatures() {}

  update(delta) {
    if (!this.group.parent) return;
    const cameraPosition = this.group.getWorldPosition(new THREE.Vector3());
    this.lodSystem?.update(delta, cameraPosition);
    this.updateSpecificFeatures(delta);
  }

  updateSpecificFeatures(delta) {}

  dispose() {
    this.lodSystem?.dispose();
  }
}
