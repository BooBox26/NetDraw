import type { Diagram } from '../types/diagram';
import { cleanIp } from './linkValidation';

export interface AuditIssue {
  type: 'device' | 'link' | 'ipam';
  severity: 'error' | 'warning' | 'info';
  message: string;
}

// 1. Mask Sensitive Data for Client Exports
export function maskSensitiveData(diagram: Diagram): Diagram {
  const clone = JSON.parse(JSON.stringify(diagram)) as Diagram;
  // Mask serial numbers, owners, and public IPs
  for (const s of clone.shapes) {
    if (s.device) {
      const dev = s.device;
      if (dev.serialNumber) {
        dev.serialNumber = '***MASKED***';
      }
      if (dev.owner) {
        dev.owner = '***INTERNAL-ONLY***';
      }
      if (dev.stackMembers) {
        dev.stackMembers = dev.stackMembers.map((m) => ({
          ...m,
          serialNumber: m.serialNumber ? '***MASKED***' : undefined,
        }));
      }
      if (dev.modules) {
        dev.modules = dev.modules.map((m) => ({
          ...m,
          serialNumber: m.serialNumber ? '***MASKED***' : undefined,
        }));
      }
    }
    if (s.ports) {
      for (const p of s.ports) {
        if (p.ipAddress) {
          const ip = cleanIp(p.ipAddress);
          // Mask public IPs (anything NOT in RFC 1918 or private space)
          const isPrivate =
            ip.startsWith('10.') ||
            ip.startsWith('192.168.') ||
            ip.startsWith('172.16.') ||
            ip.startsWith('172.17.') ||
            ip.startsWith('172.18.') ||
            ip.startsWith('172.19.') ||
            ip.startsWith('172.20.') ||
            ip.startsWith('172.21.') ||
            ip.startsWith('172.22.') ||
            ip.startsWith('172.23.') ||
            ip.startsWith('172.24.') ||
            ip.startsWith('172.25.') ||
            ip.startsWith('172.26.') ||
            ip.startsWith('172.27.') ||
            ip.startsWith('172.28.') ||
            ip.startsWith('172.29.') ||
            ip.startsWith('172.30.') ||
            ip.startsWith('172.31.') ||
            ip.startsWith('fd') ||
            ip.startsWith('fe80') ||
            ip === '127.0.0.1' ||
            ip === '::1';
          if (!isPrivate) {
            p.ipAddress = 'X.X.X.X (Public Masked)';
          }
        }
      }
    }
  }
  return clone;
}

// 2. Generate CSV inventories
export function generateCsvInventory(diagram: Diagram): {
  devices: string;
  links: string;
  subnets: string;
} {
  // Devices CSV
  let devicesCsv = 'Hostname,Role,Vendor,Model,OS,OS Version,Serial Number,Status,Owner,Tags\n';
  for (const s of diagram.shapes) {
    if (s.device) {
      const dev = s.device;
      devicesCsv += `"${dev.hostname || s.name || s.text || ''}","${dev.role || ''}","${dev.vendor || ''}","${dev.model || ''}","${dev.osName || ''}","${dev.osVersion || ''}","${dev.serialNumber || ''}","${dev.status || ''}","${dev.owner || ''}","${(dev.tags || []).join(';')}"\n`;
    }
  }

  // Links CSV
  let linksCsv =
    'Connector ID,Source Shape,Source Port,Target Shape,Target Port,Technology,Link State,Bandwidth,VLAN,Media\n';
  for (const c of diagram.connectors) {
    const src = diagram.shapes.find((s) => s.id === c.sourceId);
    const tgt = diagram.shapes.find((s) => s.id === c.targetId);
    const srcPortId = c.sourceAnchor?.replace('port:', '');
    const tgtPortId = c.targetAnchor?.replace('port:', '');
    const srcPort = src?.ports?.find((p) => p.id === srcPortId);
    const tgtPort = tgt?.ports?.find((p) => p.id === tgtPortId);

    linksCsv += `"${c.id}","${src?.name || src?.text || ''}","${srcPort?.label || ''}","${tgt?.name || tgt?.text || ''}","${tgtPort?.label || ''}","${c.technology || ''}","${c.linkState || ''}","${c.capacity?.bandwidth || ''}","${c.capacity?.vlan || ''}","${c.capacity?.media || ''}"\n`;
  }

  // Subnets CSV
  let subnetsCsv = 'Prefix,Name,VLAN ID,VRF,Zone,Gateway,Site\n';
  if (diagram.subnets) {
    for (const sub of diagram.subnets) {
      const vrf = diagram.vrfs?.find((v) => v.id === sub.vrfId)?.name || '';
      subnetsCsv += `"${sub.prefix}","${sub.name}","${sub.vlanId || ''}","${vrf}","${sub.zone || ''}","${sub.gateway || ''}","${sub.site || ''}"\n`;
    }
  }

  return { devices: devicesCsv, links: linksCsv, subnets: subnetsCsv };
}

// 3. Generate Markdown Documentation
export function generateMarkdownDocumentation(
  diagram: Diagram,
  classification: string = 'internal',
  workflowStatus: string = 'draft'
): string {
  let md = `# Network Documentation: System Infrastructure Report\n\n`;
  md += `**Classification**: \`${classification.toUpperCase()}\` | **Workflow Status**: \`${workflowStatus.toUpperCase()}\` | **Export Date**: ${new Date().toLocaleDateString()}\n\n`;

  md += `## 1. Executive Summary\n`;
  md += `This document lists the inventory, network topologies, and address allocation plans for the current project.\n\n`;

  md += `## 2. Equipment Index\n\n`;
  md += `| Hostname | Role | Vendor | Model | OS / Version | Status | Owner |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
  let hasDevices = false;
  for (const s of diagram.shapes) {
    if (s.device) {
      hasDevices = true;
      const dev = s.device;
      md += `| **${dev.hostname || s.name || s.text || 'N/A'}** | ${dev.role || 'generic'} | ${dev.vendor || '-'} | ${dev.model || '-'} | ${dev.osName || '-'} ${dev.osVersion || ''} | \`${dev.status || 'unknown'}\` | ${dev.owner || '-'} |\n`;
    }
  }
  if (!hasDevices) md += `| *No devices modeled* | | | | | | |\n`;
  md += `\n`;

  md += `## 3. Link Connectivity Matrix\n\n`;
  md += `| Link ID | Source Node | Port | Target Node | Port | Media / Technology | Bandwidth | State |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
  let hasLinks = false;
  for (const c of diagram.connectors) {
    hasLinks = true;
    const src = diagram.shapes.find((s) => s.id === c.sourceId);
    const tgt = diagram.shapes.find((s) => s.id === c.targetId);
    const srcPortId = c.sourceAnchor?.replace('port:', '');
    const tgtPortId = c.targetAnchor?.replace('port:', '');
    const srcPort = src?.ports?.find((p) => p.id === srcPortId);
    const tgtPort = tgt?.ports?.find((p) => p.id === tgtPortId);

    md += `| \`${c.id.slice(0, 8)}\` | ${src?.name || src?.text || 'N/A'} | \`${srcPort?.label || '-'}\` | ${tgt?.name || tgt?.text || 'N/A'} | \`${tgtPort?.label || '-'}\` | ${c.capacity?.media || '-'} (${c.technology}) | ${c.capacity?.bandwidth || '-'} | \`${c.linkState}\` |\n`;
  }
  if (!hasLinks) md += `| *No active connections* | | | | | | | |\n`;
  md += `\n`;

  md += `## 4. IPAM IP/VLAN Allocations\n\n`;
  md += `| Prefix | Subnet Name | VLAN ID | VRF | Zone | Gateway | Site |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
  let hasSubnets = false;
  if (diagram.subnets && diagram.subnets.length > 0) {
    hasSubnets = true;
    for (const sub of diagram.subnets) {
      const vrf = diagram.vrfs?.find((v) => v.id === sub.vrfId)?.name || 'default';
      md += `| \`${sub.prefix}\` | ${sub.name} | ${sub.vlanId || '-'} | ${vrf} | ${sub.zone || '-'} | \`${sub.gateway || '-'}\` | ${sub.site || '-'} |\n`;
    }
  }
  if (!hasSubnets) md += `| *No subnets defined* | | | | | | |\n`;
  md += `\n`;

  return md;
}

// 4. Generate HTML interactive payload
export function generateHtmlInteractive(diagram: Diagram, svgString: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Interactive Network Diagram</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; background: #0f172a; color: #f8fafc; height: 100vh; display: flex; flex-direction: column; }
    header { background: #1e293b; padding: 12px 20px; border-b: 1px solid #334155; display: flex; align-items: center; justify-content: space-between; }
    .search-box { background: #0f172a; border: 1px solid #475569; border-radius: 6px; padding: 6px 12px; color: #f8fafc; width: 250px; font-size: 13px; }
    .container { flex: 1; position: relative; overflow: auto; display: flex; align-items: center; justify-content: center; }
    svg { max-width: 100%; max-height: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.5); background: #ffffff; }
    .tooltip { position: absolute; background: rgba(15, 23, 42, 0.95); border: 1px solid #38bdf8; border-radius: 6px; padding: 10px; font-size: 11px; color: #f8fafc; pointer-events: none; display: none; z-index: 100; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
    .tooltip h4 { margin: 0 0 6px 0; color: #38bdf8; font-size: 13px; }
    .tooltip p { margin: 3px 0; }
  </style>
</head>
<body>
  <header>
    <div>
      <h2 style="margin: 0; font-size: 16px;">Interactive Network Diagram Viewer</h2>
      <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Zoom, search, and hover over elements for details</div>
    </div>
    <input type="text" id="search" class="search-box" placeholder="Search devices by hostname or IP..." />
  </header>
  <div class="container" id="canvas">
    ${svgString}
  </div>
  <div class="tooltip" id="tooltip"></div>

  <script>
    const tooltip = document.getElementById('tooltip');
    const svg = document.querySelector('svg');
    const shapes = ${JSON.stringify(diagram.shapes)};

    // Attach interaction to svg shapes
    document.querySelectorAll('[data-shape-id]').forEach(el => {
      const id = el.getAttribute('data-shape-id');
      const sh = shapes.find(s => s.id === id);
      if (!sh) return;

      el.style.cursor = 'pointer';
      
      el.addEventListener('mouseenter', (e) => {
        el.setAttribute('opacity', '0.8');
        tooltip.style.display = 'block';
        let html = '<h4>' + (sh.name || sh.text || sh.type) + '</h4>';
        if (sh.device) {
          const dev = sh.device;
          html += '<p><b>Role:</b> ' + (dev.role || 'generic') + '</p>';
          html += '<p><b>Vendor:</b> ' + (dev.vendor || '-') + ' (' + (dev.model || '-') + ')</p>';
          html += '<p><b>OS:</b> ' + (dev.osName || '-') + ' ' + (dev.osVersion || '') + '</p>';
          html += '<p><b>Status:</b> ' + (dev.status || '-') + '</p>';
        }
        if (sh.ports && sh.ports.length > 0) {
          html += '<p style="border-top:1px solid #334155; margin-top:5px; padding-top:5px;"><b>Ports:</b></p>';
          sh.ports.forEach(p => {
            if (p.ipAddress) {
              html += '<p>' + p.label + ': ' + p.ipAddress + ' (VLAN ' + (p.vlan || '-') + ')</p>';
            }
          });
        }
        tooltip.innerHTML = html;
      });

      el.addEventListener('mousemove', (e) => {
        tooltip.style.left = (e.pageX + 15) + 'px';
        tooltip.style.top = (e.pageY + 15) + 'px';
      });

      el.addEventListener('mouseleave', () => {
        el.setAttribute('opacity', '1');
        tooltip.style.display = 'none';
      });
    });

    // Simple search filter
    document.getElementById('search').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('[data-shape-id]').forEach(el => {
        const id = el.getAttribute('data-shape-id');
        const sh = shapes.find(s => s.id === id);
        if (!sh) return;

        const name = (sh.name || sh.text || '').toLowerCase();
        const vendor = (sh.device?.vendor || '').toLowerCase();
        const model = (sh.device?.model || '').toLowerCase();
        const ips = (sh.ports || []).map(p => (p.ipAddress || '').toLowerCase()).join(' ');

        if (!q || name.includes(q) || vendor.includes(q) || model.includes(q) || ips.includes(q)) {
          el.setAttribute('opacity', '1');
        } else {
          el.setAttribute('opacity', '0.15');
        }
      });
    });
  </script>
</body>
</html>`;
}

// 5. Generate Audit Report
export function generateAuditReport(diagram: Diagram): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Check shapes / devices
  for (const s of diagram.shapes) {
    if (s.device) {
      const dev = s.device;
      if (!dev.hostname) {
        issues.push({
          type: 'device',
          severity: 'warning',
          message: `Device shape "${s.name || s.text || s.id}" has no hostname defined.`,
        });
      }
      if (!dev.model) {
        issues.push({
          type: 'device',
          severity: 'info',
          message: `Device "${dev.hostname || s.name || s.id}" has no hardware model configuration.`,
        });
      }
    }
  }

  // Check ports IP duplicates
  const ipMap = new Map<string, string>(); // IP -> Host/Port string
  for (const s of diagram.shapes) {
    if (s.ports) {
      for (const p of s.ports) {
        if (p.ipAddress) {
          const ip = cleanIp(p.ipAddress);
          const name = s.device?.hostname || s.name || s.text || s.id;
          if (ipMap.has(ip)) {
            issues.push({
              type: 'ipam',
              severity: 'error',
              message: `Duplicate IP Address conflict: IP ${p.ipAddress} is assigned to ${name}:${p.label} and also to ${ipMap.get(ip)}.`,
            });
          } else {
            ipMap.set(ip, `${name}:${p.label}`);
          }
        }
      }
    }
  }

  // Check subnets IP limits
  if (diagram.subnets) {
    for (const sub of diagram.subnets) {
      if (!sub.gateway) {
        issues.push({
          type: 'ipam',
          severity: 'info',
          message: `Subnet prefix ${sub.prefix} has no default gateway declared.`,
        });
      }
    }
  }

  return issues;
}
