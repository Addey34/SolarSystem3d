import * as THREE from 'three';

export function createStarfield(texture, options = {}) {
  // Validation robuste de la texture
  if (!texture || !texture.isTexture) {
    console.error("Texture invalide - création d'une texture de secours");
    texture = new THREE.TextureLoader().load(
      '/src/assets/stars/starsmilky_8k.jpg'
    );
    texture.colorSpace = THREE.SRGBColorSpace;
  }

  const { size = 10000, rotationSpeed = 0.00005 } = options;

  // Optimisation de la géométrie
  const geometry = new THREE.SphereGeometry(size, 64, 64);

  // Configuration matériau améliorée
  texture.mapping = THREE.EquirectangularReflectionMapping;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
    fog: false,
  });

  // Création du skybox avec propriétés optimisées
  const skybox = new THREE.Mesh(geometry, material);
  skybox.name = 'starfield_skybox';
  skybox.renderOrder = -Infinity; // Garantit qu'il sera rendu en premier

  // Animation fluide
  skybox.userData.update = (delta) => {
    skybox.rotation.y += delta * rotationSpeed;
    skybox.rotation.x += delta * rotationSpeed * 0.3;
  };

  return skybox;
}
