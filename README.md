# multi-connectionstring

> 🧩 Manage multiple database connection strings from a single configuration file.  
> Switch easily between environments, clients, or databases — via **CLI or API**.

[![npm version](https://img.shields.io/npm/v/multi-connectionstring.svg)](https://www.npmjs.com/package/multi-connectionstring)
[![npm downloads](https://img.shields.io/npm/dt/multi-connectionstring.svg)](https://www.npmjs.com/package/multi-connectionstring)
[![GitHub release](https://img.shields.io/github/v/release/mazeor9/multi-connectionstring.svg)](https://github.com/mazeor9/multi-connectionstring/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🚀 Features

- 🔄 **Switch** between multiple connection strings (e.g. clients, environments)
- 🗂️ Support for **JSON**, **YAML**, and **INI** config files
- ⚙️ **Environment variable override** (`DB_CLIENT`, `DBCONFIG_FILE`)
- 💻 Built-in **CLI tool** (`mcs`) for quick switching and inspection
- 🧠 Simple **JavaScript API** for integration in any Node.js project
- 📦 Minimal dependencies (`yaml`, `ini`, `dotenv`)
- 🛠️ Works with any DB driver (PostgreSQL, MySQL, MSSQL, MongoDB, etc.)

---

## ⚠️ Security Notice

**IMPORTANT:** Configuration files contain sensitive connection strings with usernames and passwords.

**Best practices:**
- ✅ **Always add `.dbconfig.*` to your `.gitignore`**
- ✅ Never commit config files with real credentials to version control
- ✅ Use environment variables for sensitive data in production
- ✅ Consider using connection strings without embedded passwords (use cloud provider IAM authentication when possible)
- ✅ Keep different configs for dev/staging/prod

**Example `.gitignore`:**
```gitignore
.dbconfig.json
.dbconfig.yaml
.dbconfig.yml
.dbconfig.ini
.env
```

---

## 🧑‍💻 Installation

```bash
npm install multi-connectionstring
```

This installs both the **library** (for programmatic use) and the **CLI tool** (`mcs`).

---

## ⚙️ Configuration file

Create a file in your project root named **`.dbconfig.json`**,
or `.dbconfig.yaml` / `.dbconfig.yml` / `.dbconfig.ini`.

The file contains all your database connection strings and their parameters.

### Example: JSON

```json
{
  "clients": {
    "clientA": {
      "connectionString": "postgres://user:pass@hostA/dbA",
      "active": false
    },
    "clientB": {
      "connectionString": "postgres://user:pass@hostB/dbB",
      "active": true
    },
    "clientC": {
      "connectionString": "postgres://user:pass@hostC/dbC"
    }
  }
}
```

### Example: YAML

```yaml
clients:
  clientA:
    connectionString: postgres://user:pass@hostA/dbA
    active: false
  clientB:
    connectionString: postgres://user:pass@hostB/dbB
    active: true
  clientC:
    connectionString: postgres://user:pass@hostC/dbC
```

### Example: INI

```ini
[clientA]
connectionString=postgres://user:pass@hostA/dbA
active=false

[clientB]
connectionString=postgres://user:pass@hostB/dbB
active=true

[clientC]
connectionString=postgres://user:pass@hostC/dbC
```

---

## 🧭 CLI Usage

After installing, you can use the `mcs` command directly in your terminal.

### List all connection strings

```bash
mcs list
```

Example output:

```
  clientA         ->  postgres://user:pass@hostA/dbA
* clientB         ->  postgres://user:pass@hostB/dbB
  clientC         ->  postgres://user:pass@hostC/dbC

* = active connection
```

---

### Show the active connection

```bash
mcs current
```

Example output:

```
Active connection:
clientB -> postgres://user:pass@hostB/dbB
```

---

### Switch active connection

```bash
mcs use clientA
```

This updates the `.dbconfig` file by setting `active: true` for `clientA` and `false` for all others.

Output:
```
✓ Connection "clientA" is now active.
```

---

### Help

```bash
mcs --help
```

---

## 💻 API Usage

You can also use `multi-connectionstring` inside your Node.js code.

### Import

```js
const {
  getActiveConnection,
  setActiveConnection,
  listConnections,
  getConnectionByKey
} = require('multi-connectionstring');
```

---

### Get the active connection

```js
const active = getActiveConnection();
console.log(active.key, active.connectionString);
// Output: clientB postgres://user:pass@hostB/dbB
```

If `DB_CLIENT` is set in your environment, that key will be used.
Otherwise, it returns the one marked `active: true` in the config file.

**Returns:** `{ key, connectionString, active, ...otherFields }` or `null` if none active

---

### Set a connection as active

```js
setActiveConnection('clientC');
console.log('✓ Switched to clientC');
```

This updates the file, setting `active=true` for `clientC`.

**Returns:** `true` on success  
**Throws:** Error if key doesn't exist or file issues

---

### List all connections

```js
const all = listConnections();
console.log(all);
// [
//   { key: 'clientA', connectionString: '...', active: false },
//   { key: 'clientB', connectionString: '...', active: true },
//   ...
// ]
```

---

### Get a connection by key

```js
const conn = getConnectionByKey('clientA');
if (conn) {
  console.log(conn.connectionString);
} else {
  console.log('Client not found');
}
```

**Returns:** Connection object or `null` if not found

---

## 🌱 Environment Variables

| Variable            | Description                                                           |
| ------------------- | --------------------------------------------------------------------- |
| **`DB_CLIENT`**     | Forces a specific connection key (runtime only, does not modify file) |
| **`DBCONFIG_FILE`** | Custom path to your `.dbconfig` file                                  |
| **`.env`**          | Automatically loaded if present (via `dotenv`)                        |

Example `.env`:

```env
DB_CLIENT=clientB
DBCONFIG_FILE=./config/mydbconfig.yaml
```

---

## 🧩 Typical workflow

1. Define all connection strings in `.dbconfig.json`
2. Add `.dbconfig.json` to `.gitignore`
3. Use `mcs list` to view them
4. Switch quickly via `mcs use clientB`
5. In your app, call `getActiveConnection()` to always get the current one

---

## 🔌 Example integration with database client

### PostgreSQL (pg)

```js
const { getActiveConnection } = require('multi-connectionstring');
const { Client } = require('pg');

(async () => {
  const active = getActiveConnection();
  
  if (!active) {
    console.error('No active connection configured');
    process.exit(1);
  }
  
  const client = new Client({ connectionString: active.connectionString });
  await client.connect();
  
  console.log('✓ Connected to', active.key);
  
  // Your queries here...
  const res = await client.query('SELECT NOW()');
  console.log(res.rows[0]);
  
  await client.end();
})();
```

### MongoDB (mongoose)

```js
const { getActiveConnection } = require('multi-connectionstring');
const mongoose = require('mongoose');

(async () => {
  const active = getActiveConnection();
  await mongoose.connect(active.connectionString);
  console.log('✓ Connected to MongoDB:', active.key);
})();
```

### MySQL (mysql2)

```js
const { getActiveConnection } = require('multi-connectionstring');
const mysql = require('mysql2/promise');

(async () => {
  const active = getActiveConnection();
  const connection = await mysql.createConnection(active.connectionString);
  console.log('✓ Connected to MySQL:', active.key);
})();
```

---

## 🧱 File resolution order

`multi-connectionstring` will look for configuration in this order:

1. Path from `DBCONFIG_FILE` (if provided)
2. `.dbconfig.json`
3. `.dbconfig.yaml` / `.dbconfig.yml`
4. `.dbconfig.ini`

If none is found, an error is thrown.

---

## 🔧 Error Handling

The package provides clear error messages for common issues:

```js
try {
  const active = getActiveConnection();
  // Use connection...
} catch (err) {
  console.error('Error:', err.message);
  // Examples:
  // - Config file not found. Create .dbconfig.json...
  // - DB_CLIENT="invalid" does not match any client...
  // - Client "xyz" must be an object with at least a connectionString field
}
```

---

## 📝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 🪪 License

MIT © 2025

---

## 💬 Support

- 🐛 [Report a bug](https://github.com/mazeor9/multi-connectionstring/issues)
- 💡 [Request a feature](https://github.com/mazeor9/multi-connectionstring/issues)
- ❓ [Ask a question](https://github.com/mazeor9/multi-connectionstring/discussions)