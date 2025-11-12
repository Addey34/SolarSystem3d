import { SolarSystemApp } from './SolarSystemApp.js';
import Logger from './utils/Logger.js';

Logger.production = false;

// DOM
const fullscreenBtn = document.getElementById('fullscreen-btn');
const progressBar = document.getElementById('load-progress');
const loadStatus = document.getElementById('load-status');
const loader = document.getElementById('loader');

// Fullscreen
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement
      .requestFullscreen()
      .catch((err) => Logger.error('Fullscreen error', err));
  } else {
    document
      .exitFullscreen()
      .catch((err) => Logger.error('Fullscreen exit error', err));
  }
});

// Loader updates
function updateProgress(percent, message) {
  progressBar.style.width = `${percent}%`;
  loadStatus.textContent = message;
  Logger.debug(`[Loader] ${percent}% — ${message}`);
}

// Planet Controls
async function setupPlanetControls(cameraManager) {
  const buttons = document.querySelectorAll('.controls button');
  Logger.info('Binding planet control events...');

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const planetId = button.id.replace('orbit-', '');
      Logger.info(`Planet selected: ${planetId}`);

      buttons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');

      cameraManager.setTarget(planetId);
    });
  });
}

// Loader Hide
function hideLoader() {
  loader.style.opacity = '0';
  setTimeout(() => (loader.style.display = 'none'), 500);
}

// Error UI
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

// App Boot
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
