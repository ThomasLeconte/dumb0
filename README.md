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

Running a PostgreSQL database usually means juggling between `psql`, pgAdmin, Datadog, and a handful of home-grown scripts.
**Dumb0** brings the essentials together in a lightweight, local web application: a clear dashboard to visualize the
state of your database at a glance, understand what's happening under the hood.

No cloud, no account to create, no data leaving your server. You connect your database, and that's it.

> Designed for those who want **a simple and quick overview** of their database — no bloat, no overkill.

---

## ✨ Features

### 📊 General dashboard
Right after connecting, a full panorama of your database:
- Key counters: **number of tables**, **number of indexes**, **total size**, **shared buffers**
- List of **active connections** (user, application, IP, start date) with the ability to disconnect a session
- Real-time **locks** tracking, with a visual alert when locks are blocking the database
- Automatic detection of the **`pg_stat_statements`** extension to know whether fine-grained query analysis is available

### 🗂️ Per-table inspection
Dive into each table individually:
- **Size**: total, data, and index
- **Row statistics** (insertions, updates, deletions, scans)
- **I/O statistics**: sequential scans vs index scans, blocks read from disk vs cache
- **Indexes**: definition of every index on the table
- **Locks** specific to the table

### 🧪 SQL Query editor
A full-featured editor, powered by **Monaco** (the engine behind VS Code):
- Syntax highlighting, autocompletion, multi-cursor
- **Execute** queries with timing and row count
- **History** of executed queries
- **Save and reuse** your favorite queries
- **Built-in guardrail**: potentially destructive queries are blocked before execution
- Copy results in one click

### 🤖 Built-in AI assistant
A helping hand from AI to understand and optimize your queries:
- **Query analysis**: explanation, points of attention, optimization suggestions
- Contextual **index suggestions**, based on the tables actually queried
- Clean **Markdown** rendering of the answers, right inside the app
- Powered by **Mistral AI** — just set your API key in the settings

### 🔄 Auto-refresh
- Automatic and configurable refresh of indicators (custom interval)
- Real-time visual indicator of the refresh status
- Ideal for monitoring a database continuously without clicking "Reload"

### 🔌 Multi-datasource management
- Connect **multiple PostgreSQL databases** and switch between them instantly
- Connections **stored locally** (embedded SQLite database) — your credentials never leave your machine
- Duplicate, edit, and delete your connections in a few clicks

---

## 🚀 Installation

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- An accessible PostgreSQL database

### Run the container
#### Docker CLI :
```bash
docker run -d --name dumb0-container -p 3000:3000 -p 80:80 \
  --add-host host.docker.internal:host-gateway \
  -v dumb0-data:/srv/dumb0/data \
  thomasleconte/dumb0:latest
```

#### Docker compose
```yaml
version: '3.8'

services:
  dumb0:
    image: thomasleconte/dumb0:latest
    container_name: dumb0-container
    ports:
      - "3000:3000"
      - "80:80"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    volumes:
      - dumb0-data:/srv/dumb0/data
    restart: always

volumes:
  dumb0-data:
```

The app is then available at `http://localhost` (frontend) and the API at `http://localhost:3000`.

> **Note on PostgreSQL host:** the flag `--add-host host.docker.internal:host-gateway` lets the container reach a PostgreSQL instance running on your host machine via `host.docker.internal`. If your database runs elsewhere, use its hostname or IP address instead.

### Data persistence

The embedded SQLite database (datasources, query history, saved queries, settings) live in `/srv/dumb0/data` inside the container.

The commands above mount a **named Docker volume** (`dumb0-data`), so your data survives container recreation and image upgrades. Deleting the volume (`docker volume rm dumb0-data`) wipes the data.

<details>
<summary>Use a folder on your machine instead of a named volume</summary>

Replace `dumb0-data:/srv/dumb0/data` with an **absolute path** to a folder on your host:

```bash
# Docker CLI
docker run -d --name dumb0-container -p 3000:3000 -p 80:80 \
  --add-host host.docker.internal:host-gateway \
  -v /absolute/path/on/your/machine:/srv/dumb0/data \
  thomasleconte/dumb0:latest
```

```yaml
# Docker compose
    volumes:
      - /absolute/path/on/your/machine:/srv/dumb0/data
```

The folder does not need to exist beforehand — Docker creates it (as root on Linux). On first start the app writes `app.db` and `key.bin` inside it. You can then back up the folder directly, since the SQLite database is a single file. Note: the path must be absolute; a relative path would be interpreted as a named volume.

</details>


---

## 🛠️ Tech stack

| Area         | Technology                 |
|--------------|----------------------------|
| Backend      | **ExpressJS** |
| Frontend     | **Vue 3** + TypeScript     |
| UI           | **PrimeVue**, **Tailwind CSS** |
| SQL editor   | **Monaco Editor**          |
| Remote databases | **PostgreSQL** (`pg`)      |
| Local storage | **SQLite** (`node:sqlite`) |
| AI           | **Mistral AI**             |

---

## 🤝 Contributing
Contributions are welcome! Fork the repository, create a branch, and open a pull request.

> You first need to get a free Community licence key from PrimeUI which owns Primevue, [check this link!](https://primeui.store/primeui).

### Run project locally
If you want to run project, you will have to define a `.env` file in `src/front` folder. Then, launch back & front, and have fun!

### Build Docker container locally
Set the PrimeUI licence key in an environment variable with your terminal. Use this same terminal to launch following command :
```bash
docker build -f src/Dockerfile -t dumb0-image --build-arg VITE_PRIMEVUE_LICENCE_KEY=$VITE_PRIMEVUE_LICENCE_KEY .
```

### Running container
```bash
docker run --name dumb0-test -p 3000:3000 -p 80:80 \
  --add-host host.docker.internal:host-gateway \
  -v dumb0-data:/srv/dumb0/data \
  dumb0-image
```
---

## 📄 License

Distributed under the **MIT** license. See the [`LICENSE`](LICENSE) file.
