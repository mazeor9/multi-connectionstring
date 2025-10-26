// Load .env automatically if present to support DB_CLIENT / DBCONFIG_FILE overrides
require('dotenv').config();

const { findConfigFile } = require('./file-utils');
const { loadConfig, saveConfig } = require('./config-loader');

/**
 * Get the active connection:
 * - If DB_CLIENT is set, return that client (does NOT modify the file)
 * - Else, return the (first) client with active=true
 * - Else, return null
 * 
 * @returns {object|null} Active connection object or null
 * @throws {Error} If config file not found or DB_CLIENT doesn't exist
 */
function getActiveConnection() {
  const file = findConfigFile();
  if (!file) {
    throw new Error(
      'Config file not found. Create .dbconfig.json/.yaml/.ini in your project root or set DBCONFIG_FILE environment variable.'
    );
  }

  const { model } = loadConfig(file);

  // Check for DB_CLIENT environment override
  const envKey = process.env.DB_CLIENT;
  if (envKey) {
    const item = model.clients[envKey];
    if (!item) {
      const available = Object.keys(model.clients).join(', ');
      throw new Error(
        `DB_CLIENT="${envKey}" does not match any client in config. Available clients: ${available}`
      );
    }
    return { key: envKey, ...item };
  }

  // Find first active connection
  const entries = Object.entries(model.clients);
  const actives = entries.filter(([_, v]) => !!v.active);
  
  if (actives.length === 0) {
    return null;
  }
  
  // If multiple are active, pick the first deterministically
  const [key, val] = actives[0];
  return { key, ...val };
}

/**
 * List all connections as array of { key, connectionString, active, ... }.
 * 
 * @returns {Array<object>} Array of connection objects
 * @throws {Error} If config file not found
 */
function listConnections() {
  const file = findConfigFile();
  if (!file) {
    throw new Error('Config file not found.');
  }
  
  const { model } = loadConfig(file);
  return Object.entries(model.clients).map(([key, val]) => ({ key, ...val }));
}

/**
 * Get a connection by key (does not affect "active" state).
 * 
 * @param {string} key - The client key to retrieve
 * @returns {object|null} Connection object or null if not found
 * @throws {Error} If config file not found
 */
function getConnectionByKey(key) {
  if (!key || typeof key !== 'string') {
    throw new Error('Key must be a non-empty string');
  }
  
  const file = findConfigFile();
  if (!file) {
    throw new Error('Config file not found.');
  }
  
  const { model } = loadConfig(file);
  const item = model.clients[key];
  
  if (!item) {
    return null;
  }
  
  return { key, ...item };
}

/**
 * Set the given key as the only active connection (persisting to disk).
 * This sets active=true for the given key and active=false for all others.
 * Does NOT consider DB_CLIENT (which is a runtime override).
 * 
 * @param {string} key - The client key to set as active
 * @returns {boolean} Always returns true on success
 * @throws {Error} If config file not found or key doesn't exist
 */
function setActiveConnection(key) {
  if (!key || typeof key !== 'string') {
    throw new Error('Key must be a non-empty string');
  }
  
  const file = findConfigFile();
  if (!file) {
    throw new Error('Config file not found.');
  }
  
  const ctx = loadConfig(file);
  const { model } = ctx;

  if (!model.clients[key]) {
    const available = Object.keys(model.clients).join(', ');
    throw new Error(
      `Key "${key}" not found in config. Available clients: ${available}`
    );
  }

  // Set all to inactive except the target key
  for (const k of Object.keys(model.clients)) {
    model.clients[k] = { 
      ...model.clients[k], 
      active: k === key 
    };
  }

  saveConfig(file, ctx.kind, model);
  return true;
}

module.exports = {
  getActiveConnection,
  listConnections,
  setActiveConnection,
  getConnectionByKey
};