const path = require('path');
const { readFileSafe, writeFileSafe } = require('./file-utils');
const YAML = require('yaml');
const INI = require('ini');

/**
 * Validate a connection string format
 * @param {string} connectionString - The connection string to validate
 * @param {string} key - The client key (for error messages)
 * @throws {Error} If connection string is invalid
 */
function validateConnectionString(connectionString, key) {
  if (!connectionString || typeof connectionString !== 'string') {
    throw new Error(`Client "${key}": connectionString must be a non-empty string`);
  }
  
  if (connectionString.trim().length === 0) {
    throw new Error(`Client "${key}": connectionString cannot be empty or whitespace`);
  }
}

/**
 * Convert the user-provided raw config into an internal normalized model:
 * {
 *   clients: {
 *     key: { connectionString, active?, ...anyOtherFields }
 *   }
 * }
 */
function parseRawToModel(raw, kind) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Config file must contain a valid object');
  }

  let data;
  if (kind === 'json' || kind === 'yaml') {
    data = raw;
  } else if (kind === 'ini') {
    data = { clients: raw };
  } else {
    throw new Error('Unsupported config format');
  }

  // If JSON/YAML has no "clients" top-level, assume top-level entries are clients
  if (!data.clients && (kind === 'json' || kind === 'yaml')) {
    data = { clients: data };
  }

  // Validate that we have at least one client
  if (!data.clients || typeof data.clients !== 'object' || Object.keys(data.clients).length === 0) {
    throw new Error('Config must contain at least one client definition');
  }

  // Normalize fields and coerce "active" where needed
  const normalized = { clients: {} };
  for (const [key, val] of Object.entries(data.clients)) {
    if (!val || typeof val !== 'object') {
      throw new Error(`Client "${key}" must be an object with at least a connectionString field`);
    }

    const v = { ...val };
    
    // Validate connection string
    validateConnectionString(v.connectionString, key);
    
    // Normalize active field
    if (v.active !== undefined) {
      if (typeof v.active === 'string') {
        const low = v.active.toLowerCase();
        v.active = (low === 'true' || low === '1' || low === 'yes');
      } else if (typeof v.active === 'number') {
        v.active = v.active !== 0;
      } else {
        v.active = !!v.active;
      }
    }
    
    normalized.clients[key] = v;
  }

  return normalized;
}

/**
 * Serialize the internal model back to the original format.
 * @param {object} model - The normalized model
 * @param {string} kind - Format type ('json', 'yaml', or 'ini')
 * @returns {string} Serialized content
 */
function serializeModel(model, kind) {
  if (kind === 'json') {
    return JSON.stringify(model, null, 2);
  }
  if (kind === 'yaml') {
    return YAML.stringify(model);
  }
  if (kind === 'ini') {
    return INI.stringify(model.clients || {});
  }
  throw new Error('Unsupported config format: ' + kind);
}

/**
 * Detect format from file extension.
 * @param {string} filePath - Path to the config file
 * @returns {string|null} Format type or null if unknown
 */
function detectKindByExt(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.json') return 'json';
  if (ext === '.yaml' || ext === '.yml') return 'yaml';
  if (ext === '.ini') return 'ini';
  return null;
}

/**
 * Load and parse the config file into the normalized model.
 * @param {string} filePath - Path to the config file
 * @returns {object} Object with { kind, model }
 * @throws {Error} If file cannot be parsed or is invalid
 */
function loadConfig(filePath) {
  const rawStr = readFileSafe(filePath);
  const kind = detectKindByExt(filePath);
  
  if (!kind) {
    throw new Error('Cannot infer config format from file extension. Use .json, .yaml, .yml, or .ini');
  }

  let parsed;
  try {
    if (kind === 'json') {
      parsed = JSON.parse(rawStr);
    } else if (kind === 'yaml') {
      parsed = YAML.parse(rawStr);
    } else if (kind === 'ini') {
      parsed = INI.parse(rawStr);
    }
  } catch (err) {
    throw new Error(`Failed to parse ${kind.toUpperCase()} config file: ${err.message}`);
  }

  const model = parseRawToModel(parsed, kind);
  return { kind, model };
}

/**
 * Save the normalized model back to disk using the original format.
 * @param {string} filePath - Path to save the config file
 * @param {string} kind - Format type
 * @param {object} model - The normalized model to save
 */
function saveConfig(filePath, kind, model) {
  const content = serializeModel(model, kind);
  writeFileSafe(filePath, content);
}

module.exports = {
  loadConfig,
  saveConfig,
  detectKindByExt,
  parseRawToModel,
  serializeModel,
  validateConnectionString
};