/**
 * @fileoverview Point d'entrée principal de l'application Solar System 3D
 * Gère l'initialisation de l'application, le chargement, les contrôles UI
 * et la gestion des erreurs au niveau de l'interface utilisateur.
 */

import { SolarSystemApp } from './SolarSystemApp.js';
import Logger from './utils/Logger.js';

// ============================================================================
// ÉLÉMENTS DOM
// ============================================================================

/** @type {HTMLButtonElement} Bouton pour activer/désactiver le mode plein écran */
const fullscreenBtn = document.getElementById('fullscreen-btn');

/** @type {HTMLElement} Barre de progression du chargement */
const progressBar = document.getElementById('load-progress');

/** @type {HTMLElement} Texte affichant le statut de chargement */
const loadStatus = document.getElementById('load-status');

/** @type {HTMLElement} Conteneur de l'écran de chargement */
const loader = document.getElementById('loader');

// ============================================================================
// GESTION DU PLEIN ÉCRAN
// ============================================================================

/**
 * Gestionnaire d'événement pour le bouton plein écran.
 * Bascule entre le mode plein écran et le mode fenêtré.
 */
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    // Passer en mode plein écran
    document.documentElement
      .requestFullscreen()
      .catch((err) => Logger.error('Fullscreen error', err));
  } else {
    // Quitter le mode plein écran
    document
      .exitFullscreen()
      .catch((err) => Logger.error('Fullscreen exit error', err));
  }
});

// ============================================================================
// GESTION DU CHARGEMENT
// ============================================================================

/**
 * Met à jour l'affichage de la progression du chargement.
 * @param {number} percent - Pourcentage de progression (0-100)
 * @param {string} message - Message descriptif de l'étape en cours
 */
function updateProgress(percent, message) {
  progressBar.style.width = `${percent}%`;
  loadStatus.textContent = message;
  Logger.debug(`[Loader] ${percent}% — ${message}`);
}

/**
 * Cache l'écran de chargement avec une animation de fondu.
 * L'élément est masqué après 500ms de transition.
 */
function hideLoader() {
  loader.style.opacity = '0';
  setTimeout(() => (loader.style.display = 'none'), 500);
}

// ============================================================================
// CONTRÔLES DES PLANÈTES
// ============================================================================

/**
 * Configure les événements de clic sur les boutons de sélection des planètes.
 * Chaque bouton permet de déplacer la caméra vers la planète correspondante.
 * @param {CameraSystem} cameraManager - Instance du système de caméra
 */
async function setupPlanetControls(cameraManager) {
  const buttons = document.querySelectorAll('.controls button');
  Logger.info('Binding planet control events...');

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      // Extraire l'identifiant de la planète depuis l'ID du bouton (ex: "orbit-earth" -> "earth")
      const planetId = button.id.replace('orbit-', '');
      Logger.info(`Planet selected: ${planetId}`);

      // Mettre à jour l'état visuel des boutons (un seul actif à la fois)
      buttons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');

      // Déplacer la caméra vers la planète sélectionnée
      cameraManager.setTarget(planetId);
    });
  });
}

// ============================================================================
// GESTION DES ERREURS
// ============================================================================

/**
 * Affiche un écran d'erreur convivial en cas d'échec de l'application.
 * Remplace le contenu du loader par un message d'erreur et un bouton de rechargement.
 * @param {Error} error - L'erreur survenue
 */
function showError(error) {
  Logger.error('Application Error:', error);

  loader.innerHTML = `
    <div style="text-align: center;">
      <h2 style="color: red;">Application Error</h2>
      <p>${error.message}</p>
      <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 20px;">
        Retry
      </button>
    </div>
  `;
}

// ============================================================================
// DÉMARRAGE DE L'APPLICATION
// ============================================================================

/**
 * Fonction auto-exécutée qui initialise l'application.
 * Charge les ressources, initialise les systèmes et configure les contrôles.
 * En cas d'erreur, affiche un écran d'erreur convivial.
 */
(async function loadApp() {
  try {
    Logger.info('App starting...');
    updateProgress(10, 'Loading core components...');

    const app = new SolarSystemApp();
    Logger.debug('Initializing SolarSystemApp...');
    const { cameraSystem } = await app.init(updateProgress);

    if (!cameraSystem) throw new Error('CameraSystem unavailable');

    await setupPlanetControls(cameraSystem);

    Logger.success('Application fully loaded');
    hideLoader();
  } catch (err) {
    showError(err);
  }
})();
