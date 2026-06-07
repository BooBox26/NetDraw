# Performance & Robustesse — NETDRAW Documentation

Ce document détaille l'architecture, les optimisations de performance et les mécanismes de robustesse mis en œuvre dans NETDRAW pour répondre aux exigences de production de niveau opérateur.

---

## 1. Moteur Graphique & Rendu Vectoriel

### Rendu Vectoriel Optimisé & LOD (Level of Detail)

- **Shallow State Subscriptions** : Les composants s'abonnent uniquement aux tranches de données strictes du store Zustand pour éviter des re-renders en cascade lors des déplacements à 60 FPS.
- **Level of Detail (LOD) Canvas Bypass** : Lorsque le zoom descend en dessous de `0.15` (affichage éloigné de grandes topologies), le moteur désactive le rendu des détails vectoriels des équipements réseau complexes. Ils sont remplacés par des rectangles simplifiés avec la couleur de l'équipement, réduisant de 90 % le nombre de nœuds SVG dans le DOM et éliminant tout ralentissement.
- **React.memo** : Les composants `ShapeRenderer` et `ConnectorRenderer` sont mémoïsés pour éviter de recalculer les tracés géométriques ou de recréer les éléments DOM si leurs propriétés n'ont pas changé.

### Virtualisation du Canevas (Canvas Virtualization)

- Seules les formes situées dans la zone visible de l'écran (viewport) augmentée d'une marge de sécurité de 100 pixels sont rendues.
- Les connecteurs (liens réseau) hors écran sont également exclus dynamiquement du DOM, à moins que l'une de leurs formes d'extrémité ne soit visible.
- Cette virtualisation permet de charger des topologies géantes contenant des milliers d'équipements sans surcharger le processeur graphique du navigateur.

---

## 2. Sauvegarde & Mode Récupération (Crash Recovery)

### Double-Sauvegarde Hybride

- **Sauvegarde Locale Instantanée** : Chaque modification applique une écriture immédiate dans le stockage local du navigateur (`localStorage` via la clé `netdraw:autosave:v1`).
- **Sauvegarde Serveur Asynchrone** : Un intervalle d'auto-sauvegarde (30 secondes par défaut, paramétrable via `AUTOSAVE_INTERVAL_MS`) envoie les modifications au serveur de manière transparente en tâche de fond.

### Détection de Conflits & Mode Hors Ligne (Offline)

- **Détection des Conflits (HTTP 409)** : Le client envoie l'horodatage de sa dernière copie chargée (`lastLoadedAt`). Le serveur compare cette valeur avec le champ `updatedAt` en base de données. Si un autre utilisateur a sauvegardé une version plus récente, le serveur retourne un code d'erreur `409 Conflict`, faisant passer l'interface client en état de conflit. L'utilisateur peut alors choisir d'écraser la version du serveur (Force Save) ou de rafraîchir son écran.
- **Basse Connectivité** : En cas de coupure réseau, l'application reste entièrement interactive. Le statut passe en `Offline (Saved Local)`. Dès que la connexion est rétablie (événement navigateur `online`), le système déclenche automatiquement une resynchronisation en tâche de fond.

### Mode de Récupération Après Crash

- Au chargement d'un projet, NETDRAW compare l'horodatage de la version locale avec celle du serveur.
- Si une sauvegarde locale non synchronisée et plus récente est détectée, un modal interactif propose à l'utilisateur de restaurer son travail récupéré ou de charger la version du serveur.

---

## 3. Compression & Réparation des Fichiers

### Compression des Projets (.ndj)

- NETDRAW utilise l'API Web standard `CompressionStream('gzip')` pour compresser les fichiers de projet exportés sous le format `.ndj`. Les images et icônes embarquées ne pénalisent plus l'espace de stockage.
- **Compatibilité descendante** : L'importateur détecte automatiquement les octets magiques Gzip (`0x1f 0x8b`). S'ils sont absents, le fichier est lu comme du texte JSON brut non compressé de manière transparente.

### Détection & Réparation des Fichiers Corrompus

Le chargeur intègre un outil de réparation robuste (`repairDiagram`) qui réalise les vérifications suivantes :

1. **Validation structurelle** : Restaure les propriétés de page par défaut si manquantes ou corrompues.
2. **Coordonnées invalides** : Corrige les valeurs `NaN`, `null`, ou infinies pour les repositionner à des valeurs par défaut valides.
3. **Calques orphelins** : Réaffecte à des calques éditables valides toute forme dont le calque d'origine a été supprimé.
4. **Liens réseau orphelins (Dangling Connectors)** : Isole et détache proprement les connecteurs dont les formes source ou cible n'existent plus dans le projet.
5. **Hiérarchies circulaires** : Casse les références parent-enfant invalides ou circulaires.

---

## 4. Observabilité & Télémétrie

### Exposition des Métriques (Prometheus)

Pour les déploiements auto-hébergés, le serveur expose les métriques au format standard Prometheus sur le endpoint `/api/v1/metrics` :

- Utilisation de la mémoire du processus Node.js (`node_memory_rss`, `node_memory_heap_used`, `node_memory_heap_total`).
- Temps d'activité du serveur (`node_uptime_seconds`).
- Temps processeur CPU utilisateur et système (`node_cpu_user_time_seconds`, `node_cpu_system_time_seconds`).
- Nombre total de projets en base de données (`netdraw_projects_total`).
- Nombre d'assets vectoriels stockés (`netdraw_assets_total`).

### Logs & Health checks

- **Niveau de Log ajustable** : Configurez la variable d'environnement `LOG_LEVEL` (ex: `info`, `debug`, `error`).
- **Health check de préparation** : `/api/v1/health/ready` effectue un ping réel sur la base de données SQL pour valider que le conteneur est prêt à recevoir du trafic.

### Télémétrie désactivable

- **100 % Télémétrie-free par défaut** : Par souci de conformité RGPD et de confidentialité pour les infrastructures critiques, NETDRAW n'envoie aucune donnée à des serveurs tiers.
- Le paramètre `TELEMETRY_ENABLED` dans `apps/backend/src/config.ts` est positionné sur `false` par défaut.

---

## 5. Tests de Charge & Recommandations de Dimensionnement

| Métrique                      | Limite Constatée (60 FPS maintenus) | Recommandation / Comportement                                                   |
| :---------------------------- | :---------------------------------- | :------------------------------------------------------------------------------ |
| **Nombre d'objets (Canevas)** | ~2 500 formes + connecteurs         | Le mode LOD s'active automatiquement pour préserver la fluidité.                |
| **Taille de fichier projet**  | < 15 Mo (non compressé)             | Compresse à environ 1,2 Mo via Gzip.                                            |
| **Nombre de pages**           | ~10 pages par projet                | Recommander de séparer les très grandes topologies WAN complexes par site/page. |

### Dimensionnement Serveur Self-Hosted

- **Usage Standard (< 50 utilisateurs simultanés)** :
  - CPU : 1 Core (vCPU)
  - RAM : 512 Mo
  - Base de données : SQLite (par défaut sur volume Docker)
- **Usage Intensif (> 50 utilisateurs simultanés & collaboration temps réel)** :
  - CPU : 2 Cores
  - RAM : 2 Go
  - Base de données : PostgreSQL dédiée (configurable via `DATABASE_URL`)
