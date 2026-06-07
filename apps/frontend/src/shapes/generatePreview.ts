import fs from 'fs';
import { isometric25dPlugins, ISOMETRIC_SLOTS } from './isometric25d';

// Category mapping helper
function getCategoryName(type: string): string {
  if (
    type.includes('router') ||
    type.includes('switch') ||
    type.includes('firewall') ||
    type.includes('vpn') ||
    type.includes('load-balancer') ||
    type.includes('proxy') ||
    type.includes('ids') ||
    type.includes('ips') ||
    type.includes('sdwan')
  ) {
    if (
      type.includes('sec') ||
      type.includes('bastion') ||
      type.includes('waf') ||
      type.includes('siem')
    )
      return 'Sécurité';
    return 'Réseau';
  }
  if (
    type.includes('rack') ||
    type.includes('patch-panel') ||
    type.includes('odf') ||
    type.includes('pdu') ||
    type.includes('ups') ||
    type.includes('kvm')
  )
    return 'Datacenter';
  if (type.includes('server') || type.includes('hypervisor') || type.includes('cluster'))
    return 'Serveurs';
  if (
    type.includes('nas') ||
    type.includes('san') ||
    type.includes('baie') ||
    type.includes('backup')
  )
    return 'Stockage';
  if (
    type.includes('pop') ||
    type.includes('olt') ||
    type.includes('ont') ||
    type.includes('dslam') ||
    type.includes('antenne') ||
    type.includes('faisceau') ||
    type.includes('cell') ||
    type.includes('satellite')
  ) {
    if (
      type.includes('indoor') ||
      type.includes('outdoor') ||
      type.includes('access-point') ||
      type.includes('wireless-controller')
    )
      return 'Wifi';
    return 'Télécom';
  }
  if (
    type.includes('pc') ||
    type.includes('laptop') ||
    type.includes('workstation') ||
    type.includes('thin')
  )
    return 'Utilisateurs';
  if (
    type.includes('imprimante') ||
    type.includes('scanner') ||
    type.includes('telephone') ||
    type.includes('camera')
  )
    return 'Périphériques';
  if (type.includes('cloud') || type.includes('internet') || type.includes('saas')) return 'Cloud';
  return 'Divers';
}

const CATEGORIES = [
  {
    name: 'Réseau',
    color: '#3b82f6',
    desc: 'Équipements de routage, commutation et répartition de charge.',
  },
  {
    name: 'Datacenter',
    color: '#4b5563',
    desc: 'Baies physiques, distribution électrique et brassage.',
  },
  { name: 'Serveurs', color: '#64748b', desc: 'Compute physiques, virtuels et serveurs lames.' },
  { name: 'Stockage', color: '#8b5cf6', desc: 'Unités de stockage en réseau local et étendu.' },
  {
    name: 'Télécom',
    color: '#0d9488',
    desc: "Matériel d'accès opérateur, FH, fibre optique et antennes.",
  },
  {
    name: 'Wifi',
    color: '#f59e0b',
    desc: "Points d'accès sans fil, antennes et contrôleurs de réseau local.",
  },
  {
    name: 'Sécurité',
    color: '#dc2626',
    desc: 'Équipements de filtrage, bastions et protection applicative.',
  },
  {
    name: 'Utilisateurs',
    color: '#06b6d4',
    desc: 'Postes clients, ordinateurs portables et clients légers.',
  },
  {
    name: 'Périphériques',
    color: '#10b981',
    desc: "Matériel d'impression, capture vidéo et téléphonie IP.",
  },
  {
    name: 'Cloud',
    color: '#ec4899',
    desc: 'Infrastructures virtuelles, SaaS et connectivité Internet.',
  },
];

async function main() {
  const artifactPath =
    '/root/.gemini/antigravity-cli/brain/746f1d53-4b94-46c8-88b4-1a038b42bc0e/design_system_and_icons.md';

  let md = `# Guide de Style et Bibliothèque d'Icônes 2.5D (NETDRAW)\n\n`;
  md += `Ce document présente les directives de design, le nuancier officiel de la charte graphique, ainsi qu'une prévisualisation dynamique des **${isometric25dPlugins.length} icônes vectorielles 2.5D** intégrées nativement dans NETDRAW.\n\n`;

  md += `> [!NOTE]\n`;
  md += `> Toutes les icônes de cette bibliothèque sont vectorielles (SVG), sémantiquement organisées en groupes nommés, adaptatives en mode clair/sombre, et personnalisables via des **Color Slots** (Châssis, Reflets, Ombres, Status LED, Contours).\n\n`;

  // Section 1: Principes de Perspective et Design
  md += `## 1. Principes Directeurs et Perspective\n\n`;
  md += `Afin d'assurer une parfaite cohérence visuelle sur tous les diagrammes réseaux et télécoms, le système de formes utilise les règles suivantes :\n\n`;
  md += `* **Perspective Cabinet Uniforme** : Un angle de projection isométrique constant avec un décalage de profondeur de \`dx = 8\` et \`dy = 6\` pour les boîtiers standards de taille \`112x60\`. Cela garantit que toutes les formes empilées s'alignent parfaitement.\n`;
  md += `* **Ombrage 3 Faces Systématique** :\n`;
  md += `  - **Face supérieure (Lighter/Accent)** : Reçoit la lumière directe du haut (\`accent\` slot).\n`;
  md += `  - **Face principale (Medium/Body)** : Présente les détails face à l'utilisateur (\`body\` slot).\n`;
  md += `  - **Face latérale droite (Darker/Screen/Shadow)** : Crée l'illusion de profondeur (\`screen\` slot).\n`;
  md += `* **Contour Saccadé Sombre** : Toutes les lignes de coupe externe utilisent un contour solide (\`shadow\` slot, par défaut \`#1e293b\`) avec une épaisseur uniforme de \`1.2px\` pour marquer la silhouette.\n`;
  md += `* **Lisibilité Multi-échelle** : Les détails comme les indicateurs d'état et les ports RJ45/Fibre sont dimensionnés pour rester lisibles de 32px à 128px.\n\n`;

  md += `\`\`\`mermaid\ngraph TD\n  TopFace["Face supérieure (Reflet/Accent)"] -->|dx, -dy| BodyFace["Face principale (Chassis/Body)"]\n  RightFace["Face latérale (Ombre/Screen)"] -->|W, 0| BodyFace\n\`\`\`\n\n`;

  // Section 2: Palette de Couleurs
  md += `## 2. Nuancier par Catégorie de Réseau\n\n`;
  md += `Pour structurer visuellement les schémas complexes, chaque grande catégorie de matériel possède une teinte de base distinctive mais cohérente :\n\n`;
  md += `| Catégorie | Couleur Principale | Aperçu | Rôle Visuel |\n`;
  md += `| :--- | :---: | :---: | :--- |\n`;
  for (const cat of CATEGORIES) {
    md += `| **${cat.name}** | \`${cat.color}\` | <span style="background-color:${cat.color};width:20px;height:12px;display:inline-block;border:1px solid #1e293b;border-radius:2px;"></span> | ${cat.desc} |\n`;
  }
  md += `\n\n`;

  // Section 3: Previews
  md += `## 3. Prévisualisation de la Bibliothèque\n\n`;
  md += `Vous trouverez ci-dessous la collection classée par catégorie. Vous pouvez modifier ces couleurs dans le panneau de propriétés de NETDRAW.\n\n`;

  for (const cat of CATEGORIES) {
    md += `### ${cat.name}\n\n`;
    md += `| Icône | Libellé | Type ID | Rendu SVG |\n`;
    md += `| :---: | :--- | :--- | :---: |\n`;

    const catPlugins = isometric25dPlugins.filter((p) => getCategoryName(p.type) === cat.name);
    for (const plugin of catPlugins) {
      const svgContent = plugin.preview();

      // Clean preview SVG so it wraps cleanly in the markdown table cell
      const finalSvg = `<svg viewBox="0 0 24 24" width="40" height="40" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;padding:2px;">${svgContent}</svg>`;

      md += `| ${finalSvg} | **${plugin.label}** | \`${plugin.type}\` | \`<rect ... />\` |\n`;
    }
    md += `\n`;
  }

  // Section 4: Color Slots Customisation
  md += `## 4. Personnalisation & Thèmes Dynamiques\n\n`;
  md += `Chaque forme implémente les slots de couleur suivants, permettant aux concepteurs d'appliquer des codes couleurs de status (ex: rouge pour alerte, orange pour maintenance) :\n\n`;
  md += `| Slot ID | Description du slot | Rendu Standard |\n`;
  md += `| :--- | :--- | :--- |\n`;
  for (const slot of ISOMETRIC_SLOTS) {
    md += `| \`${slot.id}\` | ${slot.label} (cible : \`${slot.target}\`) | Valeur par défaut : \`${slot.default}\` |\n`;
  }
  md += `\n\n`;

  fs.writeFileSync(artifactPath, md, 'utf-8');
  console.log(`Successfully generated design system guide at ${artifactPath}`);
}

main().catch(console.error);
