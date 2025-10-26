#!/usr/bin/env node

/**
 * multi-connectionstring CLI
 *
 * A lightweight command-line tool to manage and switch between multiple
 * database connection strings stored in a .dbconfig file (JSON/YAML/INI).
 *
 * Commands:
 *   mcs list            List all defined connections
 *   mcs current         Show the currently active connection
 *   mcs use <key>       Set <key> as the active connection
 *   mcs help / -h       Show this help message
 *
 * Environment Variables:
 *   DBCONFIG_FILE       Custom path to the configuration file
 *   DB_CLIENT           Force a client at runtime (does NOT modify file)
 */

const {
  getActiveConnection,
  setActiveConnection,
  listConnections
} = require('../src/index');

const args = process.argv.slice(2);
const command = args[0];

/**
 * Displays the general CLI help text.
 */
function showHelp() {
  console.log(`
multi-connectionstring (mcs) - Manage and switch multiple connection strings

Usage:
  mcs <command> [options]

Commands:
  list           List all defined connections
  current        Show the currently active connection
  use <key>      Set <key> as active (writes to .dbconfig)
  help, -h       Show this help message

Environment Variables:
  DBCONFIG_FILE  Custom path to configuration file
  DB_CLIENT      Force a connection at runtime (does NOT modify file)

Examples:
  mcs list
  mcs current
  mcs use clientB
  DB_CLIENT=clientA mcs current

More info: https://github.com/mazeor9/multi-connectionstring
`);
}

/**
 * Displays a list of all connections, marking the active one.
 */
function handleList() {
  const entries = listConnections();
  
  if (!entries || entries.length === 0) {
    console.log('\nNo connections found.\n');
    process.exit(0);
  }

  console.log('');
  entries.forEach(e => {
    const mark = e.active ? '*' : ' ';
    const keyPadded = e.key.padEnd(15);
    console.log(`${mark} ${keyPadded} -> ${e.connectionString}`);
  });
  console.log('');
  console.log('* = active connection\n');
}

/**
 * Shows the currently active connection (or forced one via DB_CLIENT).
 */
function handleCurrent() {
  const active = getActiveConnection();
  
  if (!active) {
    console.log('\nNo active connection found.');
    console.log('Use "mcs use <key>" to set one active.\n');
    process.exit(1);
  }

  const isEnvOverride = process.env.DB_CLIENT ? ' (from DB_CLIENT env)' : '';
  console.log(`\nActive connection${isEnvOverride}:`);
  console.log(`${active.key} -> ${active.connectionString}\n`);
}

/**
 * Sets a given connection key as the active one and updates the config file.
 */
function handleUse() {
  const key = args[1];
  
  if (!key) {
    console.error('\nError: Missing client key.\n');
    console.error('Usage: mcs use <key>\n');
    console.error('Example: mcs use clientB\n');
    process.exit(1);
  }

  setActiveConnection(key);
  console.log(`\n✓ Connection "${key}" is now active.\n`);
}

/**
 * Main entrypoint - parses the command and executes the corresponding action.
 */
function main() {
  try {
    const cmd = (command || '').toLowerCase();
    
    switch (cmd) {
      case 'list':
        handleList();
        break;

      case 'current':
        handleCurrent();
        break;

      case 'use':
        handleUse();
        break;

      case 'help':
      case '-h':
      case '--help':
        showHelp();
        break;

      default:
        if (!cmd) {
          showHelp();
        } else {
          console.error(`\nError: Unknown command "${command}"\n`);
          showHelp();
          process.exit(1);
        }
        break;
    }
  } catch (err) {
    console.error(`\n✗ Error: ${err.message}\n`);
    
    // Provide helpful hints for common errors
    if (err.message.includes('Config file not found')) {
      console.error('Hint: Create a .dbconfig.json file in your project root.');
      console.error('Example:\n');
      console.error('  {');
      console.error('    "clients": {');
      console.error('      "production": {');
      console.error('        "connectionString": "postgres://user:pass@host/db",');
      console.error('        "active": true');
      console.error('      }');
      console.error('    }');
      console.error('  }\n');
    }
    
    process.exit(1);
  }
}

// Execute CLI
main();