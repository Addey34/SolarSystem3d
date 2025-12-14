/**
 * @fileoverview Utilitaire de logging avec couleurs et timestamps.
 * Fournit une interface unifiée pour les logs avec différents niveaux
 * (info, debug, warn, error, success) et formatage cohérent.
 */

import { LOGGER_SETTINGS } from '../config/settings.js';

/**
 * Classe utilitaire statique pour le logging.
 * Tous les logs incluent un timestamp et sont colorés selon leur niveau.
 */
class Logger {
  /** @type {boolean} Active/désactive les logs (sauf error qui est toujours affiché) */
  static DEBUG = LOGGER_SETTINGS.debug;

  /** @type {Object} Codes de couleur ANSI pour le terminal */
  static colors = {
    reset: '\x1b[0m',
    gray: '\x1b[90m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
  };

  static timestamp() {
    const now = new Date();
    return now.toLocaleTimeString();
  }

  static format(level, color, ...msg) {
    if (!this.DEBUG && level !== 'error') return;

    console.log(
      `${color}[${this.timestamp()}][${level.toUpperCase()}]${
        this.colors.reset
      }`,
      ...msg
    );
  }

  static info(...msg) {
    this.format('info', this.colors.blue, ...msg);
  }
  static debug(...msg) {
    this.format('debug', this.colors.gray, ...msg);
  }
  static warn(...msg) {
    this.format('warn', this.colors.yellow, ...msg);
  }
  static error(...msg) {
    this.format('error', this.colors.red, ...msg);
  }
  static success(...msg) {
    this.format('success', this.colors.green, ...msg);
  }

  static group(label) {
    if (!this.DEBUG) return;
    console.group(`${this.colors.blue}[${label}]${this.colors.reset}`);
  }

  static groupEnd() {
    if (!this.DEBUG) return;
    console.groupEnd();
  }
}

export default Logger;
