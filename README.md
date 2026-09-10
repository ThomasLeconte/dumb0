<p align="center">
  <h1 align="center">DBA App</h1>
  <p align="center">Un aperçu simple et rapide de votre base de données PostgreSQL — pensé pour les DBAs, les développeurs et les curieux.</p>
  <p align="center">
    <a href="#-fonctionnalités">Fonctionnalités</a> ·
    <a href="#-captures-décran">Captures d'écran</a> ·
    <a href="#-installation">Installation</a> ·
    <a href="#-licence">Licence</a>
  </p>
</p>

---

## 🎯 Pourquoi DBA App ?

Piloter une base PostgreSQL, c'est souvent jongler entre `psql`, pgAdmin, Datadog et une poignée de scripts maison. **DBA App** rassemble l'essentiel dans une application de bureau légère et locale : un tableau de bord clair pour visualiser l'état de votre base en un coup d'œil, comprendre ce qui se passe sous le capot, et agir vite quand quelque chose cloche.

Pas de cloud, pas de compte à créer, pas de données qui quittent votre machine. Vous connectez votre base, et c'est tout.

> Conçue pour celles et ceux qui veulent **un aperçu simple et rapide** de leur base de données — sans usine à gaz.

---

## ✨ Fonctionnalités

### 📊 Tableau de bord général
Dès la connexion, un panorama complet de votre base :
- Compteurs clés : **nombre de tables**, **nombre d'index**, **taille totale**, **shared buffers**
- Liste des **connexions actives** (utilisateur, application, IP, date de début) avec possibilité de déconnecter une session
- Suivi des **verrous (locks)** en temps réel, avec alerte visuelle quand des verrous bloquent la base
- Détection automatique de l'extension **`pg_stat_statements`** pour savoir si l'analyse fine des requêtes est disponible

![Tableau de bord général](docs/screenshots/general.png)

### 🗂️ Inspection par table
Plongez dans chaque table individuellement :
- **Taille** : total, données et index
- **Statistiques de lignes** (insertions, mises à jour, suppressions, scans)
- **Statistiques d'I/O** : scans séquentiels vs index, blocs lus sur disque vs en cache
- **Index** : définition de chaque index de la table
- **Verrous** spécifiques à la table

![Inspection d'une table](docs/screenshots/table-details.png)

### 🧪 Éditeur de requêtes SQL
Un éditeur complet, propulsé par **Monaco** (le moteur de VS Code) :
- Coloration syntaxique, autocomplétion, multi-curseurs
- **Exécution** des requêtes avec mesure du temps et du nombre de lignes
- **Historique** des requêtes exécutées
- **Sauvegarde et réutilisation** de vos requêtes favorites
- **Garde-fou intégré** : les requêtes potentiellement destructrices sont bloquées avant exécution
- Copie des résultats en un clic

![Éditeur de requêtes](docs/screenshots/query-view.png)

### 🤖 Assistant IA intégré
Un coup de pouce de l'IA pour comprendre et optimiser vos requêtes :
- **Analyse de requête** : explication, points d'attention, suggestions d'optimisation
- **Suggestions d'index** contextuelles, basées sur les tables réellement interrogées
- Réponses rendues en **Markdown** propre, directement dans l'app
- Propulsé par **Mistral AI** — il suffit de renseigner votre clé API dans les paramètres

![Assistant IA](docs/screenshots/ai-assistant.png)

### 🔄 Auto-refresh
- Rafraîchissement automatique et configurable des indicateurs (intervalle personnalisable)
- Indicateur visuel en temps réel de l'état du rafraîchissement
- Idéal pour monitorer une base en continu sans cliquer sur « Reload »

### 🔌 Gestion multi-datasources
- Connectez **plusieurs bases PostgreSQL** et basculez entre elles instantanément
- Connexions **stockées localement** (base SQLite embarquée) — vos identifiants ne quittent jamais votre machine
- Duplication, édition et suppression de vos connexions en quelques clics

### 🎨 Interface soignée
- UI moderne avec **PrimeVue** et **Tailwind CSS**
- **Mode sombre / clair** pris en charge
- Application de bureau native multiplateforme : **Windows, macOS, Linux**

---

## 🛠️ Stack technique

| Domaine | Technologie |
| --- | --- |
| Application desktop | **Electron** + Electron Forge |
| Frontend | **Vue 3** + TypeScript |
| UI | **PrimeVue**, **Tailwind CSS** |
| Éditeur SQL | **Monaco Editor** |
| Bases distantes | **PostgreSQL** (`pg`) |
| Stockage local | **SQLite** (`better-sqlite3`) |
| IA | **Mistral AI** |

---

## 🚀 Installation

### Prérequis
- [Node.js](https://nodejs.org/) (>= 18)
- Une base PostgreSQL accessible

### Lancer en développement
```bash
npm install
npm start
```

### Compiler une version installable
```bash
npm run make
```
Les artefacts (`.exe` / `.deb` / `.rpm` / `.app`) sont générés dans le dossier `out/make/`.

---

## 📸 Captures d'écran

> Les illustrations ci-dessous (emplacements `docs/screenshots/`) seront ajoutées prochainement.

- [Tableau de bord général](docs/screenshots/general.png)
- [Inspection d'une table](docs/screenshots/table-details.png)
- [Éditeur de requêtes](docs/screenshots/query-view.png)
- [Assistant IA](docs/screenshots/ai-assistant.png)

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Forkez le dépôt, créez une branche, et ouvrez une pull request.

---

## 📄 Licence

Distribué sous licence **MIT**. Voir le fichier [`LICENSE`](LICENSE).
