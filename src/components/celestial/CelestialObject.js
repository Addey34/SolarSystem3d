import * as THREE from 'three';

export default class CelestialObject {
  constructor(textureSystem, config, name, animationSystem) {
    this.name = name;
    this.config = config;
    this.textureSystem = textureSystem;
    this.animationSystem = animationSystem;
    this.group = this.createMainGroup();
  }

  createMainGroup() {
    const group = new THREE.Group();
    group.name = this.name;
    this.loadAndApplyTextures();
    return group;
  }

  // Applique les textures en fonction de la distance à la caméra
  async loadAndApplyTextures() {
    const texturePromises = Object.keys(this.config.textures).map(
      async (key) => {
        const texture = await this.textureSystem.getLODTexture(
          this.name,
          key,
          100
        ); // 100 étant la distance arbitraire
        this.applyTextureToMaterial(key, texture);
      }
    );
    await Promise.all(texturePromises);
  }

  // Applique une texture au matériau du corps céleste
  applyTextureToMaterial(key, texture) {
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    // Créer la géométrie (par exemple, une sphère pour la planète)
    const geometry = new THREE.SphereGeometry(this.config.radius, 32, 32);
    const mesh = new THREE.Mesh(geometry, material);
    this.group.add(mesh);
  }

  // Dispose les ressources
  dispose() {
    this.group?.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
    });
  }
}
