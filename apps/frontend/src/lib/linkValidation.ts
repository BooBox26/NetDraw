import type { Shape, Connector, SubnetPrefix } from '../types/diagram';

export interface ValidationIssue {
  connectorId: string;
  severity: 'warning' | 'error';
  message: string;
}

export function getHashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 45%)`;
}

// Helpers for IP subnet matching
function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let res = 0;
  for (let i = 0; i < 4; i++) {
    const p = parseInt(parts[i], 10);
    if (isNaN(p) || p < 0 || p > 255) return null;
    res = (res << 8) + p;
  }
  return res >>> 0;
}

function ipv4InSubnet(ip: string, subnet: string): boolean {
  const parts = subnet.split('/');
  if (parts.length !== 2) return false;
  const subnetIp = parts[0];
  const maskLen = parseInt(parts[1], 10);
  if (isNaN(maskLen) || maskLen < 0 || maskLen > 32) return false;

  const ipInt = ipv4ToInt(ip);
  const subInt = ipv4ToInt(subnetIp);
  if (ipInt === null || subInt === null) return false;

  if (maskLen === 0) return true;
  const mask = (~0 << (32 - maskLen)) >>> 0;
  return (ipInt & mask) === (subInt & mask);
}

function parseIpv6(ip: string): number[] | null {
  if (!ip.includes(':')) return null;
  let parts = ip.split(':');
  if (parts.length > 8) return null;

  const doubleColonIndex = parts.indexOf('');
  if (doubleColonIndex !== -1) {
    const gap = 8 - parts.filter((p) => p !== '').length;
    const left = parts.slice(0, doubleColonIndex).filter((p) => p !== '');
    const right = parts.slice(doubleColonIndex + 1).filter((p) => p !== '');
    const gapFill = Array(gap).fill('0');
    parts = [...left, ...gapFill, ...right];
  }
  if (parts.length !== 8) return null;
  const res: number[] = [];
  for (let i = 0; i < 8; i++) {
    const val = parseInt(parts[i] || '0', 16);
    if (isNaN(val) || val < 0 || val > 0xffff) return null;
    res.push(val);
  }
  return res;
}

function ipv6InSubnet(ip: string, subnet: string): boolean {
  const parts = subnet.split('/');
  if (parts.length !== 2) return false;
  const subnetIp = parts[0];
  const maskLen = parseInt(parts[1], 10);
  if (isNaN(maskLen) || maskLen < 0 || maskLen > 128) return false;

  const ipArr = parseIpv6(ip);
  const subArr = parseIpv6(subnetIp);
  if (!ipArr || !subArr) return false;

  let bitsLeft = maskLen;
  for (let i = 0; i < 8; i++) {
    if (bitsLeft >= 16) {
      if (ipArr[i] !== subArr[i]) return false;
      bitsLeft -= 16;
    } else if (bitsLeft > 0) {
      const mask = (0xffff << (16 - bitsLeft)) & 0xffff;
      if ((ipArr[i] & mask) !== (subArr[i] & mask)) return false;
      break;
    } else {
      break;
    }
  }
  return true;
}

export function cleanIp(ip: string): string {
  return ip.split('/')[0].trim();
}

export function checkIpInSubnet(ip: string, prefix: string): boolean {
  const cleaned = cleanIp(ip);
  if (cleaned.includes(':') || prefix.includes(':')) {
    return ipv6InSubnet(cleaned, prefix);
  }
  return ipv4InSubnet(cleaned, prefix);
}

export function validateConnector(
  connector: Connector,
  shapes: Shape[],
  subnets?: SubnetPrefix[]
): ValidationIssue | null {
  if (!connector.sourceId || !connector.targetId) return null;
  const source = shapes.find((s) => s.id === connector.sourceId);
  const target = shapes.find((s) => s.id === connector.targetId);
  if (!source || !target) return null;

  // Resolve ports
  const sourcePortId = connector.sourceAnchor?.replace('port:', '');
  const targetPortId = connector.targetAnchor?.replace('port:', '');

  const sourcePort = source.ports?.find((p) => p.id === sourcePortId);
  const targetPort = target.ports?.find((p) => p.id === targetPortId);

  // If both ports are resolved
  if (sourcePort && targetPort) {
    const sType = sourcePort.mediaType;
    const tType = targetPort.mediaType;

    // Copper to Fiber warning (needs transceiver/SFP)
    if ((sType === 'copper' && tType === 'fiber') || (sType === 'fiber' && tType === 'copper')) {
      const hasTransceiver =
        connector.capacity?.media?.toLowerCase().includes('sfp') ||
        connector.capacity?.media?.toLowerCase().includes('transceiver') ||
        connector.technology === 'fiber';

      if (!hasTransceiver) {
        return {
          connectorId: connector.id,
          severity: 'warning',
          message: `Media mismatch: Port ${source.name || source.text || 'Source'}:${sourcePort.label} (${sType}) connected to ${target.name || target.text || 'Target'}:${targetPort.label} (${tType}) without matching transceiver/converter.`,
        };
      }
    }

    // Console port to regular ethernet warning
    if (
      (sType === 'console' && tType !== 'console' && tType !== 'logical') ||
      (tType === 'console' && sType !== 'console' && sType !== 'logical')
    ) {
      return {
        connectorId: connector.id,
        severity: 'warning',
        message: `Console connection warning: Port ${sourcePort.label} (${sType}) is connected to ${targetPort.label} (${tType}). Check connection type.`,
      };
    }

    // Subnet IP assignment validation warnings
    if (subnets && subnets.length > 0) {
      const portsToCheck = [
        { port: sourcePort, shape: source, label: 'Source' },
        { port: targetPort, shape: target, label: 'Target' },
      ];

      for (const { port, shape, label } of portsToCheck) {
        if (port.ipAddress) {
          const ip = cleanIp(port.ipAddress);

          // 1. If port has a VLAN tag, check matching VLAN subnet
          if (port.vlan) {
            const vlanSubnets = subnets.filter((s) => s.vlanId === port.vlan);
            if (vlanSubnets.length > 0) {
              const inVlanSubnet = vlanSubnets.some((s) => checkIpInSubnet(ip, s.prefix));
              if (!inVlanSubnet) {
                return {
                  connectorId: connector.id,
                  severity: 'warning',
                  message: `IP validation: ${shape.name || shape.text || label} port ${port.label} IP ${port.ipAddress} is outside VLAN ${port.vlan} subnet prefix (${vlanSubnets.map((s) => s.prefix).join(', ')}).`,
                };
              }
            }
          }

          // 2. Check if IP falls inside any of the defined subnets
          const containingSubnet = subnets.find((s) => checkIpInSubnet(ip, s.prefix));
          if (!containingSubnet) {
            return {
              connectorId: connector.id,
              severity: 'warning',
              message: `IP validation: ${shape.name || shape.text || label} port ${port.label} IP ${port.ipAddress} does not belong to any defined subnet.`,
            };
          }
        }
      }
    }
  }

  return null;
}

export function validateAllConnectors(
  connectors: Connector[],
  shapes: Shape[],
  subnets?: SubnetPrefix[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const c of connectors) {
    const issue = validateConnector(c, shapes, subnets);
    if (issue) issues.push(issue);
  }
  return issues;
}
