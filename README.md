<p align="center">
  <h1 align="center">Dumb0</h1>
  <p align="center">A simple and quick overview of your PostgreSQL database — built for DBAs, developers, and the curious.</p>
  <p align="center">
    <a href="#-features">Features</a> ·
    <a href="#-screenshots">Screenshots</a> ·
    <a href="#-installation">Installation</a> ·
    <a href="#-license">License</a>
  </p>
</p>

---

## 🎯 Why Dumb0?

Running a PostgreSQL database usually means juggling between `psql`, pgAdmin, Datadog, and a handful of home-grown scripts. **Dumb0** brings the essentials together in a lightweight, local desktop application: a clear dashboard to visualize the state of your database at a glance, understand what's happening under the hood, and act fast when something goes wrong.

No cloud, no account to create, no data leaving your machine. You connect your database, and that's it.

> Designed for those who want **a simple and quick overview** of their database — no bloat, no overkill.

---

## ✨ Features

### 📊 General dashboard
Right after connecting, a full panorama of your database:
- Key counters: **number of tables**, **number of indexes**, **total size**, **shared buffers**
- List of **active connections** (user, application, IP, start date) with the ability to disconnect a session
- Real-time **locks** tracking, with a visual alert when locks are blocking the database
- Automatic detection of the **`pg_stat_statements`** extension to know whether fine-grained query analysis is available

![General dashboard](docs/screenshots/general.png)

### 🗂️ Per-table inspection
Dive into each table individually:
- **Size**: total, data, and index
- **Row statistics** (insertions, updates, deletions, scans)
- **I/O statistics**: sequential scans vs index scans, blocks read from disk vs cache
- **Indexes**: definition of every index on the table
- **Locks** specific to the table

![Table inspection](docs/screenshots/table-details.png)

### 🧪 SQL Query editor
A full-featured editor, powered by **Monaco** (the engine behind VS Code):
- Syntax highlighting, autocompletion, multi-cursor
- **Execute** queries with timing and row count
- **History** of executed queries
- **Save and reuse** your favorite queries
- **Built-in guardrail**: potentially destructive queries are blocked before execution
- Copy results in one click

![Query editor](docs/screenshots/query-view.png)

### 🤖 Built-in AI assistant
A helping hand from AI to understand and optimize your queries:
- **Query analysis**: explanation, points of attention, optimization suggestions
- Contextual **index suggestions**, based on the tables actually queried
- Clean **Markdown** rendering of the answers, right inside the app
- Powered by **Mistral AI** — just set your API key in the settings

![AI assistant](docs/screenshots/ai-assistant.png)

### 🔄 Auto-refresh
- Automatic and configurable refresh of indicators (custom interval)
- Real-time visual indicator of the refresh status
- Ideal for monitoring a database continuously without clicking "Reload"

### 🔌 Multi-datasource management
- Connect **multiple PostgreSQL databases** and switch between them instantly
- Connections **stored locally** (embedded SQLite database) — your credentials never leave your machine
- Duplicate, edit, and delete your connections in a few clicks

### 🎨 Polished interface
- Modern UI with **PrimeVue** and **Tailwind CSS**
- **Dark / light mode** supported
- Native cross-platform desktop application: **Windows, macOS, Linux**

---

## 🛠️ Tech stack

| Area | Technology |
| --- | --- |
| Desktop app | **Electron** + Electron Forge |
| Frontend | **Vue 3** + TypeScript |
| UI | **PrimeVue**, **Tailwind CSS** |
| SQL editor | **Monaco Editor** |
| Remote databases | **PostgreSQL** (`pg`) |
| Local storage | **SQLite** (`better-sqlite3`) |
| AI | **Mistral AI** |

---

## 🚀 Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (>= 18)
- An accessible PostgreSQL database

### Run in development
```bash
npm install
npm start
```

### Build an installable version
```bash
npm run make
```
Artifacts (`.exe` / `.deb` / `.rpm` / `.app`) are generated in the `out/make/` folder.

### 🍎 macOS: running the unsigned app

The app is **not code-signed** (no Apple Developer certificate is required to build it). On macOS, Gatekeeper will therefore block the app on first launch with the message *"my-vue-app cannot be opened because the developer cannot be verified"*.

To run it, you need to **remove the quarantine attribute** that macOS attaches to downloaded apps. Two options:

**Option A — Terminal (recommended):**
```bash
xattr -cr /path/to/my-vue-app.app
```
This removes the `com.apple.quarantine` extended attribute recursively, after which the app launches normally.

**Option B — Finder:**
Right-click the app → **Open** → confirm **Open anyway** in the dialog that appears. This only needs to be done once.

> 💡 The quarantine attribute is only set on apps transferred to your Mac (downloaded, AirDrop, USB, etc.). An app built and run on the same machine is generally not quarantined.

If you want to **self-sign** the app for your own use (avoids the warning on your machine, still requires the quarantine step on other machines):
```bash
npm run make
codesign --force --deep --sign - "out/my-vue-app-darwin-arm64/my-vue-app.app"
```
The `-` signs with an ad-hoc identity (no certificate needed). Requires the macOS Command Line Tools (`xcode-select --install`).

---

## 📸 Screenshots

> The illustrations below (located in `docs/screenshots/`) will be added soon.

- [General dashboard](docs/screenshots/general.png)
- [Table inspection](docs/screenshots/table-details.png)
- [Query editor](docs/screenshots/query-view.png)
- [AI assistant](docs/screenshots/ai-assistant.png)

---

## 🤝 Contributing

Contributions are welcome! Fork the repository, create a branch, and open a pull request.

---

## 📄 License

Distributed under the **MIT** license. See the [`LICENSE`](LICENSE) file.
