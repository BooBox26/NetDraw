Prompt : « Crée NETDRAW — Éditeur de schémas réseaux open-source »

1. Vision et positionnement produit
   Tu dois développer NETDRAW, une application web open-source auto-hébergeable via Docker, dédiée à la création de schémas réseaux et d'infrastructure pour les ingénieurs télécoms et informatiques. Elle se positionne comme une alternative simplifiée, ultra-fluide et sans friction à Draw.io (diagrams.net) et Microsoft Visio. L'expérience utilisateur doit être « droit au but » : aucune courbe d'apprentissage, des interactions instantanées, un rendu impeccable sur tous supports. Le déploiement doit se faire exclusivement via Docker Compose, sans dépendance externe obligatoire.

2. Stack technique et choix architecturaux
   Frontend

Framework : React 19 + TypeScript en mode Single Page Application (SPA). L'application doit être compilée en fichiers statiques.

Moteur de rendu : SVG natif dans le DOM pour l'éditeur principal. Cela garantit la manipulation directe des formes, des connecteurs et des événements, avec une excellente qualité d'impression et d'export. Utilise un moteur de pan/zoom custom en JS (matrice de transformation SVG transform) pour conserver la fluidité sans bibliothèque lourde. Canvas 2D ne doit être utilisé que pour un éventuel mini-map ou aperçu de haut niveau si la charge SVG devient critique.

State management : Zustand pour la gestion légère de l'état global (sélection, calques, historique).

Styling : TailwindCSS v4 + CSS modules pour les composants UI (panneaux, toolbars), pas de style inline sur les éléments SVG.

Build : Vite (compilation rapide, HMR, bundle optimisé).

Backend

Runtime : Node.js 22 + Fastify (performances supérieures à Express, overhead minimal).

API : REST JSON propre (pas de GraphQL, la simplicité prime), versionnée (/api/v1/).

Persistance : SQLite en mode fichier (/data/netdraw.db) par défaut, avec support optionnel de PostgreSQL via variable d'environnement. Prisma ORM pour le typage et les migrations.

Fichiers : Stockage local des projets (.ndj — JSON compressé) et exports (PNG/SVG/PDF) sur volume Docker monté (/data/exports).

Infrastructure & Sécurité

Reverse-proxy / serveur statique : Nginx Alpine dans un conteneur dédié, configuré avec des en-têtes de sécurité stricts (CSP, HSTS, X-Frame-Options).

Docker : Architecture multi-services via docker-compose.yml (frontend Nginx, backend API, base SQLite/Postgres sur volume). Dockerfile multi-stage pour le frontend (build Node → Nginx Alpine). Conteneur exécuté en non-root (USER nginx ou UID/GID dédié).

Sécurité applicative :

Sanitisation systématique des SVG importés côté serveur (suppression des balises <script>, on\*, <foreignObject>, DTD) via bibliothèque dédiée, complétée par DOMPurify côté client si preview inline.

Headers CSP stricte : default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:.

Protection XSS sur toutes les entrées texte (étiquettes, noms de calques).

Authentification optionnelle (mode local ou OIDC) avec JWT stocké en httpOnly + secure + SameSite=strict.

Rate-limiting sur l'API de sauvegarde/import.

3. Cahier des charges fonctionnel détaillé
   3.1. Canvas et navigation

Zone de travail infinie (viewport virtuel) avec pan (middle-click ou space+drag) et zoom (molette centrée sur le curseur, pinch sur tactile) de 10% à 500%.

Grille magnétique configurable (snap 10 px par défaut, désactivable). Affichage de la grille en pointillés subtils.

Règles latérales et supérieures dynamiques (règles de dessin style Illustrator).

3.2. Bibliothèque de formes et icônes

Panneau latéral gauche catégorisé : Équipements réseau (routeurs Cisco, switches, firewalls, ONT, OLT, serveurs, racks), Connecteurs (RJ45, fibre, coaxial), Topologies (cloud, Internet, LAN, WAN), Symboles électriques/infra, Formes génériques (rectangle, ellipse, losange, parallélogramme).

Chaque icône réseau doit être en SVG vectoriel propre (pas de bitmap), avec ancrages de connexion prédéfinis (nord, sud, est, ouest, centre).

Recherche textuelle instantanée dans la bibliothèque.

Possibilité d'ajouter ses propres SVG par drag-and-drop ou upload (stockés dans le projet, sanitisés).

3.3. Manipulation des objets

Création : Drag-and-drop depuis la bibliothèque ou double-clic sur le canvas.

Sélection : Clic simple (sélection unique), Shift+clic (ajout/retrait multi-sélection), rectangle de sélection (lasso).

Déplacement : Drag fluide avec prévisualisation en temps réel à 60 FPS.

Redimensionnement : Poignées aux 8 coins/segments, maintien des proportions avec Shift.

Rotation : Poignée de rotation circulaire au-dessus de la sélection, incréments de 15° avec Shift.

Étiquettes : Double-clic sur une forme pour éditer le texte inline (contentEditable contrôlé). Polices système uniquement. Texte alignable (gauche/centre/droite), rotatable avec le parent.

Couleurs : Picker accessible dans la toolbar (remplissage, contour, opacité). Palette rapide réseau (couleurs standards Cisco, opérateurs, ANSI).

Connecteurs : Glisser-déposer entre deux points d'ancrage ou deux formes (magnetisme). Types : ligne droite, orthogonale (manières), courbe de Bézier. Style : plein, pointillé, épaisseur configurable. Flèches directionnelles (aucune, simple, double). Déplacement intelligent : si une forme bouge, le connecteur suit. Évitement de collision avec d'autres formes.

Groupement : Ctrl+G pour grouper la sélection en un bloc logique. Le groupe se déplace, pivote et redimensionne comme une entité unique, mais reste éditable par double-clic (drill-down) ou Ctrl+Shift+G pour dégrouper.

3.4. Système de calques (Layers)

Panneau calque en bas ou droite, style Photoshop simplifié : liste nommée, réordonnable par drag-and-drop.

Actions par calque : visible/invisible, verrouillé/déverrouillé, renommer, dupliquer, supprimer.

Calque par défaut « Background » verrouillé (grille, bordure A4 optionnelle).

Calque actif unique ; nouvelles formes créées sur le calque actif.

Opacité globale du calque configurable.

3.5. Historique et annulation

Pile d'historique illimitée en mémoire (actions : créer, supprimer, déplacer, redimensionner, modifier texte/couleur, changer calque).

Ctrl+Z / Ctrl+Y avec annulation groupée (si je déplace 3 objets pendant 2 secondes, c'est une seule entrée d'historique).

Sauvegarde automatique toutes les 30 secondes et à chaque action critique (localStorage comme backup, puis POST vers /api/v1/projects/:id/save).

3.6. Import / Export

Export : SVG natif (équivalent au DOM), PNG (rasterisation côté client via <canvas> à 2× pour la netteté), JSON projet (.ndj — format interne compressé).

Import : JSON projet, SVG externe (sanitisé puis parsé en formes éditables si possible, sinon groupé comme image vectorielle).

Impression : Mise en page A4/A3/Letter avec aperçu avant impression, gestion des marges.

3.7. UI / UX

Interface minimaliste : toolbar flottante en haut (sauvegarder, undo/redo, zoom, calques, export), panneau latéral gauche (bibliothèque), panneau latéral droit (propriétés de la sélection), barre d'état en bas (coordonnées, zoom, calque actif).

Thème clair/sombre synchronisé sur prefers-color-scheme.

Raccourcis clavier complets (cf. standards : Ctrl+C/V/X, Suppr, Ctrl+D dupliquer, Ctrl+Shift+↑/↓ changer de calque, Espace maintenu pour pan).

Zéro latence perçue : les 60 FPS doivent être maintenus pendant le déplacement de 100+ formes simultanées (optimisation via requestAnimationFrame, pas de re-render React sur chaque pixel).

4. Plan de développement par phases et sous-phases
   Tu dois implémenter le projet selon les phases suivantes, en livrant un code fonctionnel et testé à chaque étape.

Phase 1 — Fondations et architecture (Week 1)
1.1. Monorepo : Initialise un repo Git avec apps/frontend (React+Vite+TS) et apps/backend (Fastify+TS+Prisma). Configure ESLint, Prettier, Husky pre-commit.
1.2. Docker : Crée docker-compose.yml et Dockerfiles multi-stage (frontend Nginx non-root, backend Node non-root). Volume /data pour SQLite et exports. Nginx sert le SPA et proxy-passe /api vers le backend.
1.3. Modèle de données Prisma : Définis les entités Project, Shape, Connector, Layer, Page, User (optionnel). Migrations auto.
1.4. API REST base : Endpoints GET/POST/PUT/DELETE pour les projets. Validation Zod. Middleware CORS, helmet, rate-limit.
1.5. CI : GitHub Actions pour lint + build + tests unitaires backend.

Phase 2 — Moteur SVG et canvas interactif (Week 2-3)
2.1. Canvas SVG infini : Implémente le <svg> root avec <g id="viewport">. Gère la matrice de transformation (pan/zoom) via transform: translate(...) scale(...) sans librairie externe.
2.2. Grille et snap : Grille visuelle (lignes/points dynamiques selon zoom). Fonction snapToGrid(x, y).
2.3. Système d'événements bas niveau : Hook custom useCanvasEvents gérant mousedown/move/up sur le SVG natif. Distingue clic simple, drag, lasso (rectangle de sélection), pan.
2.4. Hiérarchie de rendu : Crée un renderer récursif : Canvas → Layer → Group → Shape → Connector. Utilise React.memo + useRef pour éviter les re-renders inutiles. Les propriétés de style SVG (fill, stroke) sont passées comme attributs DOM directs.
2.5. Tests de performance : Benchmark avec 200 rectangles + 50 connecteurs ; vérifier 60 FPS constant en déplacement.

Phase 3 — Formes, bibliothèque et manipulation (Week 3-4)
3.1. Moteur de formes : Système de plugins de formes. Chaque forme expose : render(props), getBoundingBox(), getAnchorPoints(), resize(handle, dx, dy).
3.2. Formes de base : Rectangle, ellipse, losange, parallélogramme, texte, ligne libre.
3.3. Bibliothèque réseau : Intègre un set SVG d'icônes réseau (routeur, switch, firewall, serveur, rack, ONT, nuage). Les icônes sont des composants React SVG statiques, pas des fichiers externes.
3.4. Panneau bibliothèque : Sidebar avec catégories, recherche filtrante, drag-and-drop vers le canvas (utilise DataTransfer avec type MIME custom).
3.5. Propriétés : Panneau droit affichant et modifiant en temps réel la taille, position, rotation, couleurs, opacité, texte de la sélection. Modifications appliquées par mutation directe du state Zustand.
3.6. Étiquettes : Édition inline via <foreignObject> contenant un <div contentEditable> contrôlé, ou texte SVG <text> avec double-clic → overlay input positionné.

Phase 4 — Connecteurs et groupement (Week 4-5)
4.1. Système d'ancrage : Chaque forme expose 4+ points d'ancrage. Survoll visuel en hover. Connexion par drag d'un point d'ancrage vers un autre.
4.2. Types de connecteurs : Ligne droite (SVG <line>), Orthogonale (algo A\* simplifié ou « manhattan routing » avec 2-3 segments), Courbe quadratique ( <path> avec point de contrôle calculé).
4.3. Style des connecteurs : Épaisseur, couleur, type de trait (solid/dashed/dotted), flèches (marker-start/end SVG).
4.4. Connecteurs intelligents : Recalcul automatique du tracé quand une forme connectée bouge. Évitement basique des obstacles (padding autour des boîtes).
4.5. Groupement : Ctrl+G crée un nœud parent Group dans le state. Hit-test modifié pour intercepter les événements du groupe. Poignées de redimensionnement appliquent une matrice de transformation globale. Drill-down avec double-clic ou dégroupement Ctrl+Shift+G.

Phase 5 — Calques, historique et gestion de projet (Week 5-6)
5.1. Système de calques : Modèle de données Layer (ordre z-index, verrou, visibilité, opacité). Panneau UI drag-and-drop pour réordonner. Verrouillage empêche la sélection.
5.2. Undo/Redo : Implémente un HistoryManager avec le pattern Command. Chaque action utilisateur est encapsulée (exécuter + inverser). Limite mémoire configurable (50 actions). Undo groupé par intervalle de temps (≤ 1 seconde entre actions = même commande).
5.3. Sauvegarde : Auto-save toutes les 30s et sur beforeunload. Format JSON compressé (.ndj) envoyé au backend.
5.4. Gestionnaire de projets : Vue « Dashboard » listant les projets (titre, date modif, miniature SVG générée côté client). Création, duplication, suppression.

Phase 6 — Import, export et impression (Week 6-7)
6.1. Export SVG : Parcours récursif du DOM SVG, sérialisation en fichier .svg avec styles inline (pas de classes CSS externes).
6.2. Export PNG : Dessine le SVG dans un <canvas> hors écran à l'échelle demandée (×2 pour Retina), téléchargement via canvas.toBlob().
6.3. Import SVG : Parser côté serveur avec cheerio ou xmldom pour extraire les <rect>, <circle>, <path> basiques en formes éditables. SVG complexe importé comme image vectorielle groupée. Sanitisation obligatoire avant parsing.

6.4. Impression : CSS @media print cachant les UI panels, affichant seulement le canvas centré sur fond blanc. Option « cadre A4 » visible.

Phase 7 — Sécurité, tests et optimisation (Week 7-8)
7.1. Sécurité : Audit final CSP, headers Nginx. Suppression des eval() et new Function(). Vérification des imports SVG malveillants (tests unitaires avec payloads XSS).
7.2. Tests E2E : Playwright couvrant : créer une forme, déplacer, connecter deux formes, grouper, undo/redo, sauvegarder, exporter PNG.
7.3. Optimisation : Virtualisation du DOM SVG si nécessaire (ne pas render les formes hors viewport). Réduction du bundle (tree-shaking). Lazy-loading du panneau bibliothèque.
7.4. Documentation : README.md avec instructions Docker, CONTRIBUTING.md, API docs auto-générées (Swagger via @fastify/swagger).

5. Critères de qualité non-fonctionnels
   Performance : Temps d'interaction (TTI) < 2s. 60 FPS maintenus avec 200 formes et 100 connecteurs. Bundle JS < 300 KB gzippé (hors icônes SVG).

Accessibilité : ARIA labels sur tous les contrôles. Navigation possible au clavier (Tab, Enter, flèches). Contraste WCAG AA.

Compatibilité : Chrome/Edge/Firefox/Safari dernières 2 versions. Mobile en lecture seule (pas d'édition tactile complète pour MVP).

Sécurité : Score 0 vulnérabilité critique sur npm audit. Headers sécurisés validés via scanner en ligne. Aucune exécution de script possible via import SVG.

Maintenabilité : Couverture de tests > 70%. TypeScript strict (strict: true). Aucun any implicite.

6. Livrables attendus
   Code source complet, structuré, commenté (anglais pour le code, documentation bilingue si possible).

Fichiers docker-compose.yml + Dockerfile prêts pour docker compose up -d.

Jeu de données de démonstration : 3 schémas réseau pré-construits (LAN d'entreprise, architecture ISP simplifiée, datacenter rack).

Manuel utilisateur succinct (README) expliquant les 10 raccourcis principaux et le flux de création d'un schéma.
