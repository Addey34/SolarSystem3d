/**
 * @fileoverview Création du champ d'étoiles (skybox) pour l'arrière-plan.
 * Utilise une grande sphère inversée avec une texture d'étoiles.
 */

import * as THREE from 'three';

/**
 * Crée une skybox sphérique représentant le champ d'étoiles.
 * La sphère est rendue "de l'intérieur" grâce à THREE.BackSide.
 *
 * @param {THREE.Texture} texture - Texture panoramique des étoiles
 * @param {Object} options - Options de configuration
 * @param {number} [options.size=10000] - Rayon de la sphère skybox
 * @returns {THREE.Mesh} Mesh de la skybox prêt à être ajouté à la scène
 */
export function createStarfield(texture, options = {}) {
  const { size = 10000 } = options;

  // Créer une grande sphère qui englobe toute la scène
  const geometry = new THREE.SphereGeometry(size, 128, 128);

  // Material avec rendu sur la face intérieure (BackSide)
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide, // Rendre l'intérieur de la sphère
    fog: false, // Ignorer le brouillard de la scène
  });

  const skybox = new THREE.Mesh(geometry, material);
  skybox.name = 'starfield_skybox';

  // Rendre en premier (arrière-plan) en définissant un ordre de rendu très bas
  skybox.renderOrder = -Infinity;

  return skybox;
}
