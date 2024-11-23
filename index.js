import { OrbitControls } from 'jsm/controls/OrbitControls.js'; // Contrôles de caméra pour naviguer autour de la scène.
import * as THREE from "three"; // Module Three.js pour la création et le rendu de scènes 3D.
import TWEEN from 'tween'; // Bibliothèque pour animer des transitions.
import { getFresnelMat } from "./src/getFresnelMat.js"; // Matériau spécial pour l'effet Fresnel.
import getStarfield from "./src/getStarfield.js"; // Fonction générant un fond étoilé.

// === Dimensions de la fenêtre ===
const w = window.innerWidth; // Largeur de la fenêtre.
const h = window.innerHeight; // Hauteur de la fenêtre.

// === Création de la scène et de la caméra ===
const scene = new THREE.Scene(); // Scène principale contenant les objets 3D.
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000); 
// Caméra avec un champ de vision de 75°, un ratio largeur/hauteur, et une plage de vision (0.1 à 1000 unités).
camera.position.set(0, 0, 100); // Place la caméra à une distance initiale de 100 unités.

const renderer = new THREE.WebGLRenderer({ antialias: true }); 
// Renderer gérant le rendu des objets, avec antialiasing pour des bords lissés.
renderer.setSize(w, h); // Définit la taille du canvas pour correspondre à la fenêtre.
document.body.appendChild(renderer.domElement); // Ajoute le canvas généré au DOM de la page.
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Applique un mappage tonique pour des couleurs plus réalistes.
renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // Utilise un espace colorimétrique linéaire.

// === Contrôles interactifs ===
const controls = new OrbitControls(camera, renderer.domElement); 
// Permet à l'utilisateur de manipuler la caméra (rotation, zoom, translation).
controls.minDistance = 10; // Distance minimum autorisée pour zoomer.
controls.maxDistance = 200; // Distance maximum autorisée pour dézoomer.

// === Chargement des textures ===
const loader = new THREE.TextureLoader(); // Utilitaire pour charger les textures.
const textures = {
  sun: loader.load("./textures/08_sunmap.jpg"),
  earthMap: loader.load("./textures/00_earthmap1k.jpg"),
  earthSpec: loader.load("./textures/02_earthspec1k.jpg"),
  earthBump: loader.load("./textures/01_earthbump1k.jpg"),
  earthLights: loader.load("./textures/03_earthlights1k.jpg"),
  earthClouds: loader.load("./textures/04_earthcloudmap.jpg"),
  earthCloudsAlpha: loader.load("./textures/05_earthcloudmaptrans.jpg"),
  moonMap: loader.load("./textures/06_moonmap4k.jpg"),
  moonBump: loader.load("./textures/07_moonbump4k.jpg"),
};

// === Ajout du fond étoilé ===
const stars = getStarfield({ numStars: 40000 }); // Génère un fond étoilé contenant 40 000 étoiles.
scene.add(stars); // Ajoute les étoiles à la scène.

// === Soleil ===
const sunGeometry = new THREE.SphereGeometry(1.5, 32, 32); 
// Géométrie sphérique représentant le Soleil.
const sunMaterial = new THREE.MeshBasicMaterial({
  map: textures.sun, // Texture du Soleil.
  emissive: 0xffcc33, // Couleur émissive simulant une lumière émise.
  emissiveIntensity: 100.0, // Intensité de la lumière émise.
});
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial); // Création du maillage du Soleil.
scene.add(sunMesh); // Ajoute le Soleil à la scène.

const sunLight = new THREE.PointLight(0xffffff, 100000, 2000); 
// Lumière ponctuelle émise par le Soleil.
sunLight.castShadow = true; // Permet au Soleil de projeter des ombres.
sunMesh.add(sunLight); // Attache la lumière au Soleil.

const haloGeometry = new THREE.SphereGeometry(1.8, 32, 32); 
// Géométrie du halo lumineux entourant le Soleil.
const haloMaterial = new THREE.MeshBasicMaterial({
  color: 0xffcc33, // Couleur du halo.
  transparent: true, // Permet la transparence.
  opacity: 0.5, // Opacité du halo.
  blending: THREE.AdditiveBlending, // Mode de mélange pour un effet lumineux.
});
const haloMesh = new THREE.Mesh(haloGeometry, haloMaterial); // Crée le maillage du halo.
sunMesh.add(haloMesh); // Attache le halo lumineux au Soleil.

// === Terre et Lune ===
const earthOrbitGroup = new THREE.Group(); 
// Groupe pour gérer l'orbite de la Terre autour du Soleil.
scene.add(earthOrbitGroup);
const earthGroup = new THREE.Group(); 
// Groupe pour gérer la Terre et ses effets associés.
earthOrbitGroup.add(earthGroup);

const earthGeometry = new THREE.IcosahedronGeometry(1, 12); 
// Géométrie sphérique représentant la Terre.
const earthMaterial = new THREE.MeshPhongMaterial({
  map: textures.earthMap, // Texture de la surface terrestre.
  specularMap: textures.earthSpec, // Carte spéculaire pour simuler les reflets de l'eau.
  bumpMap: textures.earthBump, // Carte de relief pour simuler les reliefs.
  bumpScale: 0.5, // Échelle du relief.
});
const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial); // Création du maillage de la Terre.
earthGroup.add(earthMesh); // Ajoute la Terre au groupe associé.

const lightsMat = new THREE.MeshBasicMaterial({
  map: textures.earthLights, // Texture des lumières nocturnes.
  blending: THREE.AdditiveBlending, // Mélange des couleurs pour un effet lumineux.
});
const lightsMesh = new THREE.Mesh(earthGeometry, lightsMat); 
earthGroup.add(lightsMesh); // Ajoute les lumières nocturnes à la Terre.

const cloudsMat = new THREE.MeshStandardMaterial({
  map: textures.earthClouds, // Texture des nuages.
  transparent: true, 
  opacity: 0.5, // Opacité partielle des nuages.
  alphaMap: textures.earthCloudsAlpha, // Carte alpha pour gérer la transparence des nuages.
  alphaTest: 0.2, // Seuil d'opacité.
});
const cloudsMesh = new THREE.Mesh(earthGeometry, cloudsMat); 
cloudsMesh.scale.setScalar(1.003); // Ajuste légèrement la taille pour entourer la Terre.
earthGroup.add(cloudsMesh); // Ajoute les nuages à la Terre.

const fresnelMat = getFresnelMat(); 
// Matériau simulant un halo lumineux avec effet Fresnel.
const glowMesh = new THREE.Mesh(earthGeometry, fresnelMat); 
glowMesh.scale.setScalar(1.01); 
earthGroup.add(glowMesh); // Ajoute l'effet de halo lumineux à la Terre.

const moonGroup = new THREE.Group(); 
// Groupe pour gérer la Lune et son orbite.
earthGroup.add(moonGroup);
const moonGeometry = new THREE.IcosahedronGeometry(0.27, 12); 
// Géométrie sphérique représentant la Lune.
const moonMaterial = new THREE.MeshStandardMaterial({
  map: textures.moonMap, 
  bumpMap: textures.moonBump, 
  bumpScale: 0.5, 
});
const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial); 
moonGroup.add(moonMesh); // Ajoute la Lune au groupe associé.

// === Variables d'animation ===
const earthOrbitRadius = 100; // Rayon de l'orbite de la Terre autour du Soleil.
const earthOrbitSpeed = 0.0005; // Vitesse angulaire de l'orbite de la Terre.
let earthOrbitAngle = 0; 

const moonOrbitRadius = 2.5; // Rayon de l'orbite de la Lune autour de la Terre.
const moonOrbitSpeed = 0.001; // Vitesse angulaire de l'orbite de la Lune.
const moonOrbitInclination = 5 * Math.PI / 180; // Inclinaison de l'orbite de la Lune.
let moonOrbitAngle = 0;

earthGroup.rotation.z = -23.4 * Math.PI / 180; // Inclinaison de l'axe de la Terre.

// === Variables pour la caméra et les contrôles ===
let currentTarget = null; // La cible actuelle de la caméra.
let userIsInteracting = false; // Indique si l'utilisateur manipule la caméra.

// === Animation ===
function animate() {
  requestAnimationFrame(animate); // Boucle d'animation.

  // Mise à jour des positions des orbites.
  earthOrbitAngle += earthOrbitSpeed; 
  earthOrbitGroup.position.set(
    earthOrbitRadius * Math.cos(earthOrbitAngle),
    0,
    earthOrbitRadius * Math.sin(earthOrbitAngle)
  );

  moonOrbitAngle += moonOrbitSpeed;
  moonGroup.position.set(
    moonOrbitRadius * Math.cos(moonOrbitAngle),
    Math.sin(moonOrbitAngle) * moonOrbitRadius * Math.sin(moonOrbitInclination),
    moonOrbitRadius * Math.sin(moonOrbitAngle)
  );

  updateRotation(); // Mise à jour de la rotation des objets.

  // Si la caméra suit une cible, fait une interpolation douce vers cette cible.
  if (currentTarget && !userIsInteracting) {
      followTargetSmoothly(currentTarget);
  }

  TWEEN.update(); // Mise à jour des animations Tween.js.

  // Rendu de la scène.
  renderer.render(scene, camera);
}

// Fonction pour suivre une cible de manière fluide.
function followTargetSmoothly(targetMesh) {
  const targetPosition = new THREE.Vector3();
  targetMesh.getWorldPosition(targetPosition); // Récupère la position de la cible dans le monde.

  // Position idéale de la caméra, décalée par rapport à la cible.
  const cameraOffset = new THREE.Vector3(0, 0, 50); 
  const idealCameraPosition = targetPosition.clone().add(cameraOffset);

  // Interpolation de la position de la caméra.
  camera.position.lerp(idealCameraPosition, 0.05);

  // Met à jour la cible de la caméra pour qu'elle se dirige vers l'objet ciblé.
  controls.target.lerp(targetPosition, 0.05); 
  controls.update(); // Recalcule la caméra.
}

// Fonction pour faire tourner les objets.
function updateRotation() {
  earthMesh.rotation.y += 0.01; 
  lightsMesh.rotation.y += 0.01;
  cloudsMesh.rotation.y += 0.013;
  glowMesh.rotation.y += 0.015;
  moonMesh.rotation.y = -moonOrbitAngle;
}

// === Gestion des événements des boutons ===
document.getElementById('orbit-sun').addEventListener('click', () => changeOrbitTarget(sunMesh));
document.getElementById('orbit-earth').addEventListener('click', () => changeOrbitTarget(earthMesh));
document.getElementById('orbit-moon').addEventListener('click', () => changeOrbitTarget(moonMesh));

// Fonction pour changer la cible de l'orbite de la caméra.
function changeOrbitTarget(targetMesh) {
  currentTarget = targetMesh; // Met à jour la cible de la caméra.

  const targetPosition = new THREE.Vector3();
  targetMesh.getWorldPosition(targetPosition);

  const offset = new THREE.Vector3(0, 0, 50); 
  const newCameraPosition = targetPosition.clone().add(offset);

  // Anime la caméra pour se déplacer vers la nouvelle position.
  new TWEEN.Tween(camera.position)
    .to(newCameraPosition, 1000) // Durée de l'animation en ms.
    .easing(TWEEN.Easing.Quadratic.Out) // Effet d'interpolation.
    .start();

  // Recalcule la cible de la caméra.
  controls.target.copy(targetPosition);
  controls.update();
}

// === Détection de l'interaction utilisateur ===
controls.addEventListener('start', () => {
  userIsInteracting = true; // L'utilisateur commence à manipuler la caméra.
});

controls.addEventListener('end', () => {
  userIsInteracting = false; // L'utilisateur arrête de manipuler la caméra.
});

// === Lancement de l'animation ===
animate(); // Démarre la boucle d'animation.
