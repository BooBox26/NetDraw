// Lightweight i18n — translation map and a small hook. Avoids the weight
// of i18next for a project that doesn't need namespaces/plural rules yet.
// Supports FR, EN, ES, DE, PT out of the box.

import { useEffect, useState } from 'react';

export type Lang = 'en' | 'fr' | 'es' | 'de' | 'pt';

export const SUPPORTED_LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Français' },
  { id: 'es', label: 'Español' },
  { id: 'de', label: 'Deutsch' },
  { id: 'pt', label: 'Português' },
];

const STORAGE_KEY = 'nd:lang';

type Dict = Record<string, string>;
const en: Dict = {
  'app.title': 'NETDRAW',
  'toolbar.save': 'Save',
  'toolbar.export.svg': 'Export SVG',
  'toolbar.export.png': 'Export PNG',
  'toolbar.export.ndj': 'NDJ',
  'toolbar.export.pdf': 'PDF',
  'toolbar.export.html': 'HTML',
  'toolbar.export.schema': 'Schema',
  'toolbar.import': 'Import',
  'toolbar.templates': 'Templates',
  'toolbar.search': 'Search',
  'toolbar.commands': 'Commands',
  'toolbar.print': 'Print',
  'toolbar.tools': 'Tools',
  'sidebar.library': 'Library',
  'sidebar.properties': 'Properties',
  'sidebar.layers': 'Layers',
  'panel.alignment': 'Align / Distribute',
  'panel.geometry': 'Geometry',
  'panel.style': 'Style',
  'panel.text': 'Text',
  'panel.metadata': 'Metadata',
  'panel.identity': 'Identity',
  'tool.select': 'Select',
  'tool.pan': 'Pan',
  'tool.connector': 'Connector',
  'tool.pen': 'Pen',
  'tool.pencil': 'Pencil',
  'tool.highlighter': 'Highlighter',
  'tool.present': 'Present',
  'menu.duplicate': 'Duplicate',
  'menu.delete': 'Delete',
  'menu.group': 'Group',
  'menu.ungroup': 'Ungroup',
  'menu.bringToFront': 'Bring to front',
  'menu.sendToBack': 'Send to back',
  'menu.alignLeft': 'Align left',
  'menu.alignRight': 'Align right',
  'menu.alignCenterH': 'Align center (horizontal)',
  'menu.alignCenterV': 'Align center (vertical)',
  'menu.alignTop': 'Align top',
  'menu.alignBottom': 'Align bottom',
  'menu.distributeH': 'Distribute horizontally',
  'menu.distributeV': 'Distribute vertically',
  'common.cancel': 'Cancel',
  'common.apply': 'Apply',
  'common.search': 'Search',
  'common.loading': 'Loading…',
};
const fr: Dict = {
  'app.title': 'NETDRAW',
  'toolbar.save': 'Enregistrer',
  'toolbar.export.svg': 'Exporter SVG',
  'toolbar.export.png': 'Exporter PNG',
  'toolbar.export.ndj': 'NDJ',
  'toolbar.export.pdf': 'PDF',
  'toolbar.export.html': 'HTML',
  'toolbar.export.schema': 'Schéma',
  'toolbar.import': 'Importer',
  'toolbar.templates': 'Modèles',
  'toolbar.search': 'Rechercher',
  'toolbar.commands': 'Commandes',
  'toolbar.print': 'Imprimer',
  'toolbar.tools': 'Outils',
  'sidebar.library': 'Bibliothèque',
  'sidebar.properties': 'Propriétés',
  'sidebar.layers': 'Calques',
  'panel.alignment': 'Aligner / Distribuer',
  'panel.geometry': 'Géométrie',
  'panel.style': 'Style',
  'panel.text': 'Texte',
  'panel.metadata': 'Métadonnées',
  'panel.identity': 'Identité',
  'tool.select': 'Sélectionner',
  'tool.pan': 'Déplacer',
  'tool.connector': 'Connecteur',
  'tool.pen': 'Plume',
  'tool.pencil': 'Crayon',
  'tool.highlighter': 'Surligneur',
  'tool.present': 'Présentation',
  'menu.duplicate': 'Dupliquer',
  'menu.delete': 'Supprimer',
  'menu.group': 'Grouper',
  'menu.ungroup': 'Dégrouper',
  'menu.bringToFront': 'Mettre au premier plan',
  'menu.sendToBack': "Envoyer à l'arrière-plan",
  'menu.alignLeft': 'Aligner à gauche',
  'menu.alignRight': 'Aligner à droite',
  'menu.alignCenterH': 'Aligner au centre (horizontal)',
  'menu.alignCenterV': 'Aligner au centre (vertical)',
  'menu.alignTop': 'Aligner en haut',
  'menu.alignBottom': 'Aligner en bas',
  'menu.distributeH': 'Distribuer horizontalement',
  'menu.distributeV': 'Distribuer verticalement',
  'common.cancel': 'Annuler',
  'common.apply': 'Appliquer',
  'common.search': 'Rechercher',
  'common.loading': 'Chargement…',
};
const es: Dict = {
  'app.title': 'NETDRAW',
  'toolbar.save': 'Guardar',
  'toolbar.import': 'Importar',
  'toolbar.templates': 'Plantillas',
  'toolbar.search': 'Buscar',
  'toolbar.commands': 'Comandos',
  'toolbar.print': 'Imprimir',
  'sidebar.library': 'Biblioteca',
  'sidebar.properties': 'Propiedades',
  'sidebar.layers': 'Capas',
  'tool.select': 'Seleccionar',
  'tool.pan': 'Mover',
  'tool.connector': 'Conector',
  'tool.pen': 'Pluma',
  'tool.pencil': 'Lápiz',
  'tool.highlighter': 'Resaltador',
  'tool.present': 'Presentar',
  'common.cancel': 'Cancelar',
  'common.search': 'Buscar',
  'common.loading': 'Cargando…',
};
const de: Dict = {
  'app.title': 'NETDRAW',
  'toolbar.save': 'Speichern',
  'toolbar.import': 'Importieren',
  'toolbar.templates': 'Vorlagen',
  'toolbar.search': 'Suchen',
  'toolbar.commands': 'Befehle',
  'toolbar.print': 'Drucken',
  'sidebar.library': 'Bibliothek',
  'sidebar.properties': 'Eigenschaften',
  'sidebar.layers': 'Ebenen',
  'tool.select': 'Auswählen',
  'tool.pan': 'Verschieben',
  'tool.connector': 'Verbinder',
  'tool.pen': 'Stift',
  'tool.pencil': 'Bleistift',
  'tool.highlighter': 'Textmarker',
  'tool.present': 'Präsentieren',
  'common.cancel': 'Abbrechen',
  'common.search': 'Suchen',
  'common.loading': 'Lädt…',
};
const pt: Dict = {
  'app.title': 'NETDRAW',
  'toolbar.save': 'Salvar',
  'toolbar.import': 'Importar',
  'toolbar.templates': 'Modelos',
  'toolbar.search': 'Buscar',
  'toolbar.commands': 'Comandos',
  'toolbar.print': 'Imprimir',
  'sidebar.library': 'Biblioteca',
  'sidebar.properties': 'Propriedades',
  'sidebar.layers': 'Camadas',
  'tool.select': 'Selecionar',
  'tool.pan': 'Mover',
  'tool.connector': 'Conector',
  'tool.pen': 'Caneta',
  'tool.pencil': 'Lápis',
  'tool.highlighter': 'Marcador',
  'tool.present': 'Apresentar',
  'common.cancel': 'Cancelar',
  'common.search': 'Buscar',
  'common.loading': 'Carregando…',
};

const DICTS: Record<Lang, Dict> = { en, fr, es, de, pt };

let currentLang: Lang =
  (typeof localStorage !== 'undefined' && (localStorage.getItem(STORAGE_KEY) as Lang)) || 'en';
const listeners = new Set<() => void>();

export function getLang(): Lang {
  return currentLang;
}

export function setLang(l: Lang): void {
  currentLang = l;
  try {
    localStorage.setItem(STORAGE_KEY, l);
  } catch {
    // ignore
  }
  for (const l of listeners) l();
}

export function t(key: string, fallback?: string): string {
  return DICTS[currentLang][key] ?? DICTS.en[key] ?? fallback ?? key;
}

export function useT(): (key: string, fallback?: string) => string {
  const [, setV] = useState(0);
  useEffect(() => {
    const fn = (): void => setV((n) => n + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return t;
}

/** Whether the application strings are translated for the given language. */
export function isTranslated(lang: Lang): boolean {
  return Object.keys(DICTS[lang]).length > 0;
}
