import * as THREE from 'three';
import { CELESTIAL_CONFIG } from '../../config/settings.js';

export class CelestialObjectLOD {
  constructor(name, textures, settings) {
    this.name = name;
    this.textures = textures;
    this.settings = settings;
    this.lod = new THREE.LOD();
    this.cloudMeshes = [];
    this.isInShadow = false;
    this.init();
  }

  init() {
    const config = this.getObjectConfig();
    if (!config) return;
    const lodLevels = CELESTIAL_CONFIG.common.lodLevels;
    Object.entries(lodLevels).forEach(([level, { segments, distance }]) => {
      const textures = this.getTexturesForDistance(distance);
      this.addLODLevel(segments, distance, textures);
    });
  }

  addLODLevel(segments, distance, textures) {
    const geometry = this.createSphereGeometry(segments);
    const material = this.createMainMaterial(textures);
    const mesh = new THREE.Mesh(geometry, material);
    this.lod.addLevel(mesh, distance);
    if (textures.clouds) {
      this.addCloudLayer(mesh, segments, textures.clouds);
    }
  }

  createSphereGeometry(segments) {
    return new THREE.SphereGeometry(this.settings.radius, segments, segments);
  }

  createMainMaterial(textures) {
    const material = new THREE.MeshPhongMaterial({
      map: textures.surface,
      normalMap: textures.normalMap,
      bumpMap: textures.bumpMap,
      roughnessMap: textures.spec,
      roughness: 0.8,
      metalness: 0.2,
      emissive: textures.lights,
      emissiveIntensity: textures.lights,
      emissiveMap: textures.lights,
    });
    return material;
  }

  addCloudLayer(parentMesh, segments, cloudTexture) {
    const cloudGeometry = new THREE.SphereGeometry(
      this.settings.radius * 1.01,
      segments,
      segments
    );

    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.8,
      alphaTest: 0.01,
    });

    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    cloudMesh.userData.isCloud = true;
    parentMesh.add(cloudMesh);
    this.cloudMeshes.push(cloudMesh);
  }

  update(cameraPosition, isInShadow = false) {
    if (!cameraPosition || !this.lod.parent) return;
    if (this.isInShadow !== isInShadow) {
      this.isInShadow = isInShadow;
      this.updateMaterials();
    }
    this.lod.updateMatrixWorld(true);
    this.lod.update(cameraPosition);
    this.cloudMeshes.forEach((cloud) => {
      cloud.rotation.y += this.settings.rotationSpeed * 0.5 * delta;
    });
  }

  updateMaterials() {
    this.lod.levels.forEach((level) => {
      const material = level.object.material;
      if (material.emissiveMap) {
        material.emissiveIntensity = this.isInShadow ? 0.5 : 0;
        material.needsUpdate = true;
      }
    });
  }

  dispose() {
    this.lod.levels.forEach((level) => {
      level.object.geometry.dispose();
      level.object.material.dispose();
      level.object.children.forEach((child) => {
        if (child.userData.isCloud) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
    });
    this.cloudMeshes = [];
  }

  getObjectConfig() {
    const bodies = CELESTIAL_CONFIG.bodies;
    return bodies[this.name] || this.findSatelliteConfig();
  }

  findSatelliteConfig() {
    for (const body of Object.values(CELESTIAL_CONFIG.bodies)) {
      if (body.satellites?.[this.name]) {
        return body.satellites[this.name];
      }
    }
    return null;
  }

  getTexturesForDistance(distance) {
    const config = this.getObjectConfig();
    const quality = this.getQualityForDistance(distance);
    const textures = {};
    if (config.textures) {
      Object.entries(config.textures).forEach(([type, basePath]) => {
        if (config.textureResolutions?.[type]?.includes(quality)) {
          textures[type] = this.getTexture(type, quality);
        } else {
          const availableResolutions = config.textureResolutions?.[type] || [
            '1k',
          ];
          const fallbackQuality = this.findClosestResolution(
            availableResolutions,
            quality
          );
          textures[type] = this.getTexture(type, fallbackQuality);
        }
      });
    }

    return textures;
  }

  findClosestResolution(availableResolutions, targetQuality) {
    const qualityOrder = ['8k', '4k', '2k', '1k'];
    const targetIndex = qualityOrder.indexOf(targetQuality);
    for (let i = targetIndex - 1; i >= 0; i--) {
      if (availableResolutions.includes(qualityOrder[i])) {
        return qualityOrder[i];
      }
    }
    for (let i = targetIndex + 1; i < qualityOrder.length; i++) {
      if (availableResolutions.includes(qualityOrder[i])) {
        return qualityOrder[i];
      }
    }
    return '1k';
  }

  getTexture(type, quality) {
    const textureKey = `${this.name}_${type}_${quality}`;
    return this.textures[textureKey] || null;
  }

  getQualityForDistance(distance) {
    const { high, medium, low } = CELESTIAL_CONFIG.common.lodLevels;
    const normalizedDistance = distance / this.settings.radius;
    const config = this.getObjectConfig();
    const allResolutions = new Set(['1k']);
    if (config.textureResolutions) {
      Object.values(config.textureResolutions).forEach((resolutions) => {
        resolutions.forEach((res) => allResolutions.add(res));
      });
    }
    const availableResolutions = Array.from(allResolutions).sort((a, b) => {
      const sizes = { '8k': 4, '4k': 3, '2k': 2, '1k': 1 };
      return sizes[b] - sizes[a];
    });
    if (
      normalizedDistance <= high.distance &&
      availableResolutions.includes('8k')
    ) {
      return '8k';
    }
    if (
      normalizedDistance <= medium.distance &&
      availableResolutions.includes('4k')
    ) {
      return '4k';
    }
    if (
      normalizedDistance <= low.distance &&
      availableResolutions.includes('2k')
    ) {
      return '2k';
    }
    return '1k';
  }
}
