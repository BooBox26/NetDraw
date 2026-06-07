import { useState, useMemo } from 'react';
import { useStore } from '../state/store';
import type { VRF, SubnetPrefix, Shape, ShapePort } from '../types/diagram';

export function IpamDialog({ onClose }: { onClose: () => void }): JSX.Element {
  const diagram = useStore((s) => s.diagram);
  const shapes = useStore((s) => s.diagram.shapes);
  const setDiagram = useStore((s) => s.setDiagram);
  const pushToast = useStore((s) => s.pushToast);

  const updateDiagram = (patch: Partial<typeof diagram>) => {
    setDiagram({ ...diagram, ...patch });
  };

  const vrfs = diagram.vrfs || [];
  const subnets = diagram.subnets || [];

  const [activeTab, setActiveTab] = useState<'prefixes' | 'vrfs' | 'calculator'>('prefixes');

  // VRF State
  const [vrfName, setVrfName] = useState('');
  const [vrfDesc, setVrfDesc] = useState('');

  // Subnet Prefix State
  const [prefixVal, setPrefixVal] = useState('');
  const [subnetName, setSubnetName] = useState('');
  const [selectedVrfId, setSelectedVrfId] = useState('');
  const [selectedVlan, setSelectedVlan] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedGateway, setSelectedGateway] = useState('');
  const [selectedSite, setSelectedSite] = useState('');

  // Calculator State
  const [calcInput, setCalcInput] = useState('192.168.1.0/24');

  // VRFs Operations
  const handleAddVrf = () => {
    if (!vrfName.trim()) return;
    const newVrf: VRF = {
      id: `vrf-${Date.now()}`,
      name: vrfName.trim(),
      description: vrfDesc.trim(),
    };
    updateDiagram({ vrfs: [...vrfs, newVrf] });
    setVrfName('');
    setVrfDesc('');
    pushToast({ kind: 'success', message: 'VRF added successfully' });
  };

  const handleRemoveVrf = (id: string) => {
    updateDiagram({
      vrfs: vrfs.filter((v) => v.id !== id),
      subnets: subnets.map((s) => (s.vrfId === id ? { ...s, vrfId: undefined } : s)),
    });
    pushToast({ kind: 'info', message: 'VRF removed' });
  };

  // Subnet Operations
  const handleAddSubnet = () => {
    if (!prefixVal.trim() || !subnetName.trim()) {
      pushToast({ kind: 'error', message: 'Prefix and Name are required' });
      return;
    }
    const newSubnet: SubnetPrefix = {
      id: `sub-${Date.now()}`,
      prefix: prefixVal.trim(),
      name: subnetName.trim(),
      vrfId: selectedVrfId || undefined,
      vlanId: selectedVlan || undefined,
      zone: selectedZone || undefined,
      gateway: selectedGateway || undefined,
      site: selectedSite || undefined,
    };
    updateDiagram({ subnets: [...subnets, newSubnet] });
    setPrefixVal('');
    setSubnetName('');
    setSelectedGateway('');
    pushToast({ kind: 'success', message: 'Subnet prefix added' });
  };

  const handleRemoveSubnet = (id: string) => {
    updateDiagram({ subnets: subnets.filter((s) => s.id !== id) });
    pushToast({ kind: 'info', message: 'Subnet prefix removed' });
  };

  // Subnet Calculator helper for IPv4
  const calcInfo = useMemo(() => {
    try {
      const parts = calcInput.split('/');
      if (parts.length !== 2) return null;
      const ip = parts[0]!;
      const cidr = parseInt(parts[1]!, 10);
      if (isNaN(cidr) || cidr < 0 || cidr > 32) return null;

      const ipParts = ip.split('.').map((p) => parseInt(p, 10));
      if (ipParts.length !== 4 || ipParts.some((p) => isNaN(p) || p < 0 || p > 255)) {
        // Basic IPv6 check
        if (ip.includes(':')) {
          const v6Cidr = parseInt(parts[1]!, 10);
          if (isNaN(v6Cidr) || v6Cidr < 0 || v6Cidr > 128) return null;
          return {
            type: 'IPv6',
            range: 'Auto-allocated range',
            mask: `Prefix Length: /${v6Cidr}`,
            broadcast: 'N/A (IPv6 uses multicast)',
            hosts: `${Math.pow(2, 128 - v6Cidr).toLocaleString()} possible addresses`,
          };
        }
        return null;
      }

      // Calculate IPv4 Mask & Network
      const mask = ~((1 << (32 - cidr)) - 1);
      const ipNum = (ipParts[0]! << 24) + (ipParts[1]! << 16) + (ipParts[2]! << 8) + ipParts[3]!;

      const netNum = ipNum & mask;
      const bcNum = netNum | ~mask;

      const toIpStr = (num: number) =>
        [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.');

      const maskStr = toIpStr(mask);
      const netStr = toIpStr(netNum);
      const bcStr = toIpStr(bcNum);
      const gateway = toIpStr(netNum + 1);
      const startRange = toIpStr(netNum + 1);
      const endRange = toIpStr(bcNum - 1);

      const hostsCount = cidr >= 31 ? 0 : bcNum - netNum - 1;

      return {
        type: 'IPv4',
        range: `${startRange} - ${endRange}`,
        mask: maskStr,
        broadcast: bcStr,
        gateway,
        hosts: hostsCount.toLocaleString(),
        network: netStr,
      };
    } catch {
      return null;
    }
  }, [calcInput]);

  // IPAM IP Allocations and Duplicates Scan
  const allocations = useMemo(() => {
    const list: Array<{
      shape: Shape;
      port: ShapePort;
      ip: string;
      vrfName: string;
      vrfId?: string;
      isDuplicate: boolean;
    }> = [];

    // Temporary map to track IP assignments per VRF to spot duplicates
    const ipCounts: Record<string, string[]> = {}; // key: "vrfId:ip", value: array of shapeIds

    for (const shape of shapes) {
      if (!shape.ports) continue;
      for (const port of shape.ports) {
        if (port.ipAddress && port.ipAddress.trim()) {
          const ip = port.ipAddress.trim();
          // Find VRF of the connector if connected, or use default VRF
          const vrfId = ''; // default VRF (global)
          const key = `${vrfId}:${ip}`;
          if (!ipCounts[key]) ipCounts[key] = [];
          ipCounts[key]!.push(shape.id);

          list.push({
            shape,
            port,
            ip,
            vrfName: 'Global',
            vrfId: undefined,
            isDuplicate: false,
          });
        }
      }
    }

    // Flag duplicates
    return list.map((item) => {
      const key = `${item.vrfId || ''}:${item.ip}`;
      const owners = ipCounts[key] || [];
      return {
        ...item,
        isDuplicate: owners.length > 1,
      };
    });
  }, [shapes]);

  // Subnet Matching Inventory
  const subnetInventory = (prefixStr: string) => {
    // Simple v4 prefix matching helper
    try {
      const parts = prefixStr.split('/');
      if (parts.length !== 2) return [];
      const prefixIp = parts[0]!;
      const cidr = parseInt(parts[1]!, 10);

      const ipParts = prefixIp.split('.').map((p) => parseInt(p, 10));
      if (ipParts.length !== 4) return [];
      const mask = ~((1 << (32 - cidr)) - 1);
      const prefixNum =
        ((ipParts[0]! << 24) + (ipParts[1]! << 16) + (ipParts[2]! << 8) + ipParts[3]!) & mask;

      return allocations.filter((alloc) => {
        try {
          const allocIp = alloc.ip.split('/')[0]!;
          const allocParts = allocIp.split('.').map((p) => parseInt(p, 10));
          if (allocParts.length !== 4) return false;
          const allocNum =
            ((allocParts[0]! << 24) +
              (allocParts[1]! << 16) +
              (allocParts[2]! << 8) +
              allocParts[3]!) &
            mask;
          return allocNum === prefixNum;
        } catch {
          return false;
        }
      });
    } catch {
      return [];
    }
  };

  // CSV Import/Export handlers
  const handleExportCSV = () => {
    if (subnets.length === 0) {
      pushToast({ kind: 'info', message: 'No subnets to export' });
      return;
    }
    const headers = 'Prefix,Name,Gateway,VLAN,Zone,Site\n';
    const rows = subnets
      .map(
        (s) =>
          `"${s.prefix}","${s.name}","${s.gateway || ''}","${s.vlanId || ''}","${s.zone || ''}","${s.site || ''}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `netdraw_ipam_subnets_${Date.now()}.csv`;
    link.click();
    pushToast({ kind: 'success', message: 'CSV exported successfully' });
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split('\n');
        const imported: SubnetPrefix[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i]?.trim();
          if (!line) continue;

          // Simple CSV splitter
          const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          if (cols[0] && cols[1]) {
            imported.push({
              id: `sub-imported-${Date.now()}-${i}`,
              prefix: cols[0],
              name: cols[1],
              gateway: cols[2] || undefined,
              vlanId: cols[3] || undefined,
              zone: cols[4] || undefined,
              site: cols[5] || undefined,
            });
          }
        }
        if (imported.length > 0) {
          updateDiagram({ subnets: [...subnets, ...imported] });
          pushToast({
            kind: 'success',
            message: `Imported ${imported.length} subnets successfully`,
          });
        }
      } catch {
        pushToast({ kind: 'error', message: 'Failed to parse CSV file' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center text-slate-800 dark:text-slate-200">
      <div className="w-[850px] max-w-[95vw] h-[80vh] flex flex-col bg-white dark:bg-slate-900 rounded-lg shadow-xl">
        <header className="px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌐</span>
            <h2 className="text-sm font-semibold">Integrated Lightweight IPAM Manager</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-xl"
          >
            ×
          </button>
        </header>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs px-2">
          <button
            onClick={() => setActiveTab('prefixes')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'prefixes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Subnets & Prefixes
          </button>
          <button
            onClick={() => setActiveTab('vrfs')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'vrfs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Virtual Routing (VRF)
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'calculator'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Subnet Calculator
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'prefixes' && (
            <div className="grid grid-cols-3 gap-4">
              {/* Left pane: Add Subnet */}
              <div className="col-span-1 p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-850 space-y-3 text-xs">
                <h3 className="font-semibold text-slate-500 uppercase tracking-wider">
                  Allocate Subnet Prefix
                </h3>
                <label className="flex flex-col gap-1">
                  <span>Subnet Prefix (e.g. 10.0.0.0/24)</span>
                  <input
                    type="text"
                    placeholder="10.0.0.0/24"
                    value={prefixVal}
                    onChange={(e) => setPrefixVal(e.target.value)}
                    className="px-2 py-1 h-8 rounded border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Subnet Name / Description</span>
                  <input
                    type="text"
                    placeholder="Office LAN"
                    value={subnetName}
                    onChange={(e) => setSubnetName(e.target.value)}
                    className="px-2 py-1 h-8 rounded border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>VRF Context</span>
                  <select
                    value={selectedVrfId}
                    onChange={(e) => setSelectedVrfId(e.target.value)}
                    className="px-2 py-1 h-8 rounded border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    <option value="">Global / Default Routing table</option>
                    {vrfs.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span>VLAN ID</span>
                    <input
                      type="text"
                      placeholder="10"
                      value={selectedVlan}
                      onChange={(e) => setSelectedVlan(e.target.value)}
                      className="px-2 py-1 h-8 rounded border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Zone</span>
                    <input
                      type="text"
                      placeholder="Trust"
                      value={selectedZone}
                      onChange={(e) => setSelectedZone(e.target.value)}
                      className="px-2 py-1 h-8 rounded border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span>Gateway IP</span>
                    <input
                      type="text"
                      placeholder="10.0.0.1"
                      value={selectedGateway}
                      onChange={(e) => setSelectedGateway(e.target.value)}
                      className="px-2 py-1 h-8 rounded border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Site</span>
                    <input
                      type="text"
                      placeholder="Paris-HQ"
                      value={selectedSite}
                      onChange={(e) => setSelectedSite(e.target.value)}
                      className="px-2 py-1 h-8 rounded border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900"
                    />
                  </label>
                </div>

                <button
                  onClick={handleAddSubnet}
                  className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium mt-2 transition-colors"
                >
                  Allocate Prefix
                </button>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                    Import / Export CSV
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="flex-1 h-7 border border-slate-350 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                    >
                      Export CSV
                    </button>
                    <label className="flex-1 h-7 border border-slate-350 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center justify-center cursor-pointer">
                      Import CSV
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleImportCSV}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Right pane: list subnets and allocations */}
              <div className="col-span-2 space-y-4">
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Allocated subnets ({subnets.length})
                  </h3>
                  {subnets.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      No subnets allocated. Fill the form to create one.
                    </p>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded divide-y divide-slate-200 dark:divide-slate-800 max-h-[35vh] overflow-y-auto">
                      {subnets.map((sub) => {
                        const matched = subnetInventory(sub.prefix);
                        const vrf = vrfs.find((v) => v.id === sub.vrfId);
                        return (
                          <div
                            key={sub.id}
                            className="p-3 text-xs space-y-2 hover:bg-slate-50 dark:hover:bg-slate-950/40"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                  {sub.prefix}
                                </span>
                                <span className="ml-2 font-medium text-slate-500">
                                  ({sub.name})
                                </span>
                                {vrf && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded text-[10px]">
                                    VRF: {vrf.name}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemoveSubnet(sub.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                Delete
                              </button>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-[10px] text-slate-500">
                              <span>Gateway: {sub.gateway || 'N/A'}</span>
                              <span>VLAN: {sub.vlanId || 'Global'}</span>
                              <span>Zone: {sub.zone || 'N/A'}</span>
                              <span>Site: {sub.site || 'N/A'}</span>
                            </div>
                            {/* Subnet Members list */}
                            {matched.length > 0 && (
                              <div className="mt-2 pl-2 border-l-2 border-slate-200 dark:border-slate-700 space-y-1">
                                <span className="font-semibold text-[10px] text-slate-400">
                                  Associated Devices:
                                </span>
                                {matched.map((alloc, idx) => (
                                  <div key={idx} className="flex justify-between text-[10px]">
                                    <span className="font-mono text-slate-600 dark:text-slate-300">
                                      {alloc.ip}
                                    </span>
                                    <span className="text-slate-500">
                                      {alloc.shape.name || alloc.shape.text || 'Device'} →{' '}
                                      {alloc.port.label}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Scan duplicates warning */}
                <section className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Duplicate IP Detection Warnings
                  </h3>
                  {allocations.filter((a) => a.isDuplicate).length === 0 ? (
                    <p className="text-xs text-emerald-500 flex items-center gap-1 font-medium">
                      ✓ No duplicate IP assignments detected in the active context.
                    </p>
                  ) : (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900 rounded space-y-1.5">
                      {allocations
                        .filter((a) => a.isDuplicate)
                        .map((alloc, idx) => (
                          <p
                            key={idx}
                            className="text-xs text-amber-700 dark:text-amber-300 font-medium"
                          >
                            ⚠️ Duplicate IP <strong className="font-mono">{alloc.ip}</strong>{' '}
                            assigned on port <strong>{alloc.port.label}</strong> of shape{' '}
                            <strong>
                              {alloc.shape.name || alloc.shape.text || alloc.shape.id}
                            </strong>
                            !
                          </p>
                        ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {activeTab === 'vrfs' && (
            <div className="grid grid-cols-3 gap-4">
              {/* Left pane: Add VRF */}
              <div className="col-span-1 p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-850 space-y-3 text-xs">
                <h3 className="font-semibold text-slate-500 uppercase tracking-wider">
                  Create Virtual Routing Domain (VRF)
                </h3>
                <label className="flex flex-col gap-1">
                  <span>VRF Name (e.g. VRF-MGMT, VRF-PROD)</span>
                  <input
                    type="text"
                    placeholder="VRF-MGMT"
                    value={vrfName}
                    onChange={(e) => setVrfName(e.target.value)}
                    className="px-2 py-1 h-8 rounded border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Description</span>
                  <input
                    type="text"
                    placeholder="Management Virtual Routing Instance"
                    value={vrfDesc}
                    onChange={(e) => setVrfDesc(e.target.value)}
                    className="px-2 py-1 h-8 rounded border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </label>

                <button
                  onClick={handleAddVrf}
                  className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium mt-2 transition-colors"
                >
                  Create VRF
                </button>
              </div>

              {/* Right pane: list VRFs */}
              <div className="col-span-2 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Configured Virtual Routing Domains ({vrfs.length})
                </h3>
                {vrfs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No custom VRF instances configured. By default all links share the global
                    routing table.
                  </p>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded divide-y divide-slate-200 dark:divide-slate-800 max-h-[50vh] overflow-y-auto">
                    {vrfs.map((vrf) => (
                      <div
                        key={vrf.id}
                        className="p-3 text-xs flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-950/40"
                      >
                        <div>
                          <strong className="text-sm text-purple-600 dark:text-purple-400">
                            {vrf.name}
                          </strong>
                          <p className="text-slate-500 font-medium text-[11px]">
                            {vrf.description || 'No description provided'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveVrf(vrf.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'calculator' && (
            <div className="space-y-4">
              <label className="flex flex-col gap-1.5 text-xs">
                <span className="font-semibold text-slate-500 uppercase">
                  Input IP Prefix / Mask (e.g. 192.168.1.0/24)
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={calcInput}
                    onChange={(e) => setCalcInput(e.target.value)}
                    className="flex-1 px-3 py-1 h-9 rounded border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono"
                  />
                </div>
              </label>

              {calcInfo ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded text-xs space-y-3">
                  <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    Calculated Subnet Properties ({calcInfo.type})
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-500 block uppercase text-[10px]">
                          Network IP Address
                        </span>
                        <strong className="font-mono text-sm">{calcInfo.network || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase text-[10px]">Netmask</span>
                        <strong className="font-mono text-sm">{calcInfo.mask}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase text-[10px]">
                          Broadcast IP Address
                        </span>
                        <strong className="font-mono text-sm">{calcInfo.broadcast}</strong>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-500 block uppercase text-[10px]">
                          Usable Range / Gateway
                        </span>
                        <strong className="font-mono text-sm">
                          {calcInfo.range} (GW: {calcInfo.gateway || 'N/A'})
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase text-[10px]">
                          Available Usable Hosts
                        </span>
                        <strong className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
                          {calcInfo.hosts}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900 rounded text-xs">
                  <p className="text-amber-600 dark:text-amber-400 italic">
                    Invalid IP CIDR prefix format. Please enter a valid IPv4 prefix (e.g.,
                    10.0.0.0/24) or IPv6 prefix (e.g. 2001:db8::/64).
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
