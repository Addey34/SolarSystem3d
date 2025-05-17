// Importation de l'application principale
import { SolarSystemApp } from './SolarSystemApp.js';

// Gestion du plein écran : Permet de basculer entre mode plein écran et normal
document
  .getElementById('fullscreen-btn') // Sélection du bouton pour le plein écran
  .addEventListener('click', toggleFullscreen); // Ajout de l'événement de clic

function toggleFullscreen() {
  // Fonction pour activer ou désactiver le mode plein écran
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(console.error); // Activer le plein écran
  } else {
    document.exitFullscreen(); // Quitter le plein écran
  }
}

// Éléments UI pour afficher l'état de chargement de l'application
const progressBar = document.getElementById('load-progress');
const loadStatus = document.getElementById('load-status');
const loader = document.getElementById('loader');

// Fonction asynchrone pour charger l'application
async function loadApp() {
  try {
    // Mise à jour de la barre de progression
    updateProgress(10, 'Loading core components...');

    // Création de l'instance de l'application et initialisation
    const app = new SolarSystemApp();
    const { cameraSystem } = await app.init(updateProgress);

    if (cameraSystem) {
      // Configuration des contrôles de la caméra si l'initialisation a réussi
      await setupPlanetControls(cameraSystem);
    }

    // Masquer l'élément de chargement après l'initialisation complète
    hideLoader();
  } catch (error) {
    // Afficher l'erreur si l'initialisation échoue
    showError(error);
  }
}

// Mise à jour de la barre de progression et du message de chargement
function updateProgress(percent, message) {
  progressBar.style.width = `${percent}%`;
  loadStatus.textContent = message;
}

// Fonction pour configurer les contrôles des planètes
function setupPlanetControls(cameraManager) {
  return new Promise((resolve) => {
    const buttons = document.querySelectorAll('.controls button');
    buttons.forEach((button) => {
      // Ajout d'un événement de clic pour chaque bouton de contrôle de planète
      button.addEventListener('click', () => {
        const planetId = button.id.replace('orbit-', ''); // Extraction de l'ID de la planète
        buttons.forEach((btn) => btn.classList.remove('active')); // Désactivation de tous les boutons
        button.classList.add('active'); // Activation du bouton sélectionné
        cameraManager.setTarget(planetId); // Mise à jour de la cible de la caméra
      });
    });
    resolve();
  });
}

// Masquer l'élément de chargement après initialisation
function hideLoader() {
  loader.style.opacity = '0'; // Rendre l'élément invisible
  setTimeout(() => {
    loader.style.display = 'none'; // Cacher l'élément après une courte durée
  }, 500);
}

// Affichage d'une erreur si quelque chose se passe mal
function showError(error) {
  console.error('Application Error:', error); // Affichage de l'erreur dans la console
  loader.innerHTML = `
    <div style="text-align: center;">
      <h2 style="color: red;">Application Error</h2>
      <p>${error.message}</p>
      <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 20px;">
        Retry
      </button>
    </div>
  `; // Affichage d'un message d'erreur dans l'UI avec un bouton pour recharger
}

loadApp(); // Appel de la fonction pour lancer l'application
