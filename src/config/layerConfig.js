/**
 * @fileoverview Configuration des couches (layers) pour les corps célestes.
 * Définit les paramètres géométriques et matériaux pour chaque type de couche.
 */

import * as THREE from 'three';

/**
 * Multiplicateurs de rayon pour chaque type de couche.
 * Définit la taille relative par rapport au rayon de base.
 */
export const LAYER_RADIUS_SCALE = {
  surface: 1.0,
  clouds: 1.01,
  atmosphere: 1.02,
  lights: 1.002,
};

/**
 * Segments de géométrie par défaut pour les sphères.
 */
export const GEOMETRY_SEGMENTS = 64;

/**
 * Segments de géométrie pour les anneaux.
 */
export const RING_SEGMENTS = 128;

/**
 * Crée la géométrie sphérique pour une couche.
 * @param {number} radius - Rayon de base du corps
 * @param {string} layerType - Type de couche (surface, clouds, etc.)
 * @returns {THREE.SphereGeometry}
 */
export function createSphereGeometry(radius, layerType = 'surface') {
  const scale = LAYER_RADIUS_SCALE[layerType] ?? 1.0;
  return new THREE.SphereGeometry(radius * scale, GEOMETRY_SEGMENTS, GEOMETRY_SEGMENTS);
}

/**
 * Crée le matériau pour la surface principale.
 * @param {boolean} isSun - Vrai si c'est le soleil (MeshBasicMaterial)
 * @returns {THREE.Material}
 */
export function createSurfaceMaterial(isSun) {
  if (isSun) {
    return new THREE.MeshBasicMaterial({ color: 0xffff00 });
  }
  return new THREE.MeshStandardMaterial({
    roughness: 0.7,
    metalness: 0.0,
  });
}

/**
 * Crée le matériau transparent pour les nuages.
 * @returns {THREE.MeshStandardMaterial}
 */
export function createCloudsMaterial() {
  return new THREE.MeshStandardMaterial({
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

/**
 * Crée le matériau transparent pour l'atmosphère.
 * @returns {THREE.MeshStandardMaterial}
 */
export function createAtmosphereMaterial() {
  return new THREE.MeshStandardMaterial({
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

/**
 * Crée le matériau pour les anneaux.
 * @returns {THREE.MeshStandardMaterial}
 */
export function createRingMaterial() {
  return new THREE.MeshStandardMaterial({
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    roughness: 0.8,
  });
}

/**
 * Configure les ombres sur un mesh.
 * @param {THREE.Mesh} mesh - Le mesh à configurer
 * @param {boolean} castShadow - Projette des ombres
 * @param {boolean} receiveShadow - Reçoit des ombres
 */
export function configureShadows(mesh, castShadow, receiveShadow) {
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
}
