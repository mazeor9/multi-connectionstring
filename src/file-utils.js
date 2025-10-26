const fs = require('fs');
const path = require('path');

/**
 * Find a config file by environment variable or by common candidates.
 * Priority:
 *  1) DBCONFIG_FILE (absolute or relative to CWD)
 *  2) .dbconfig.json / .dbconfig.yaml / .dbconfig.yml / .dbconfig.ini in CWD
 */
function findConfigFile() {
  if (process.env.DBCONFIG_FILE) {
    const resolved = path.resolve(process.cwd(), process.env.DBCONFIG_FILE);
    if (fs.existsSync(resolved)) {
      return resolved;
    }
    throw new Error(`DBCONFIG_FILE specified but not found: ${resolved}`);
  }

  const candidates = [
    '.dbconfig.json',
    '.dbconfig.yaml',
    '.dbconfig.yml',
    '.dbconfig.ini'
  ];

  for (const c of candidates) {
    const p = path.resolve(process.cwd(), c);
    if (fs.existsSync(p)) return p;
  }
  
  return null;
}

/**
 * Read file contents as UTF-8 with improved error handling.
 * @param {string} filePath - Path to the file to read
 * @returns {string} File contents
 * @throws {Error} With descriptive message for common failure cases
 */
function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Config file not found: ${filePath}`);
    }
    if (err.code === 'EACCES') {
      throw new Error(`Permission denied reading file: ${filePath}`);
    }
    if (err.code === 'EISDIR') {
      throw new Error(`Expected a file but found a directory: ${filePath}`);
    }
    throw new Error(`Error reading file ${filePath}: ${err.message}`);
  }
}

/**
 * Write file contents as UTF-8 with improved error handling.
 * @param {string} filePath - Path to the file to write
 * @param {string} content - Content to write
 * @throws {Error} With descriptive message for common failure cases
 */
function writeFileSafe(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (err) {
    if (err.code === 'EACCES') {
      throw new Error(`Permission denied writing file: ${filePath}`);
    }
    if (err.code === 'ENOENT') {
      throw new Error(`Directory does not exist for file: ${filePath}`);
    }
    if (err.code === 'EISDIR') {
      throw new Error(`Cannot write to a directory: ${filePath}`);
    }
    throw new Error(`Error writing file ${filePath}: ${err.message}`);
  }
}

module.exports = {
  findConfigFile,
  readFileSafe,
  writeFileSafe
};