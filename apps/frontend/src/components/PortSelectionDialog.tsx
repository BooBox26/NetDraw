import { useState, useMemo } from 'react';
import { useStore } from '../state/store';
import { createConnector } from '../shapes/factory';

export function PortSelectionDialog(): JSX.Element | null {
  const pending = useStore((s) => s.ui.pendingConnection);
  const shapes = useStore((s) => s.diagram.shapes);
  const addConnector = useStore((s) => s.addConnector);

  const sourceShape = useMemo(() => {
    if (!pending) return null;
    return shapes.find((s) => s.id === pending.sourceId) ?? null;
  }, [shapes, pending]);

  const targetShape = useMemo(() => {
    if (!pending) return null;
    return shapes.find((s) => s.id === pending.targetId) ?? null;
  }, [shapes, pending]);

  const sourcePorts = useMemo(() => sourceShape?.ports ?? [], [sourceShape]);
  const targetPorts = useMemo(() => targetShape?.ports ?? [], [targetShape]);

  const [selectedSourcePortId, setSelectedSourcePortId] = useState<string>('');
  const [selectedTargetPortId, setSelectedTargetPortId] = useState<string>('');

  const [customSourcePort, setCustomSourcePort] = useState<string>('');
  const [customTargetPort, setCustomTargetPort] = useState<string>('');

  if (!pending || !sourceShape || !targetShape) return null;

  const handleClose = () => {
    useStore.setState((s) => ({ ui: { ...s.ui, pendingConnection: null } }));
  };

  const handleConnect = () => {
    const srcPort = sourcePorts.find((p) => p.id === selectedSourcePortId);
    const tgtPort = targetPorts.find((p) => p.id === selectedTargetPortId);

    const sourcePortName = srcPort ? srcPort.label : customSourcePort || undefined;
    const targetPortName = tgtPort ? tgtPort.label : customTargetPort || undefined;

    const sourceAnchor = srcPort ? `port:${srcPort.id}` : pending.sourceAnchor;
    const targetAnchor = tgtPort ? `port:${tgtPort.id}` : pending.targetAnchor;

    const conn = createConnector(pending.sourceId, pending.targetId, {
      sourceAnchor,
      targetAnchor,
      sourcePort: sourcePortName,
      targetPort: targetPortName,
    });

    addConnector(conn);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-[500px] max-w-full bg-white dark:bg-slate-950 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all">
        <header className="px-6 py-4 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between bg-slate-550 dark:bg-slate-900/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Configure Connection Interfaces
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select ports to link {sourceShape.name || sourceShape.text || 'Source'} and{' '}
              {targetShape.name || targetShape.text || 'Target'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-center transition-colors text-lg"
          >
            ×
          </button>
        </header>

        <div className="p-6 space-y-6">
          {/* Source Equipment */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Source: {sourceShape.name || sourceShape.text || 'Equipment A'}
            </label>
            {sourcePorts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={selectedSourcePortId}
                  onChange={(e) => {
                    setSelectedSourcePortId(e.target.value);
                    if (e.target.value) setCustomSourcePort('');
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
                >
                  <option value="">-- Select Configured Interface --</option>
                  {sourcePorts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} {p.ipAddress ? `(${p.ipAddress})` : ''}{' '}
                      {p.vlan ? `[VLAN ${p.vlan}]` : ''}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Or enter custom name..."
                  value={customSourcePort}
                  onChange={(e) => {
                    setCustomSourcePort(e.target.value);
                    if (e.target.value) setSelectedSourcePortId('');
                  }}
                  disabled={!!selectedSourcePortId}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow disabled:opacity-50"
                />
              </div>
            ) : (
              <input
                type="text"
                placeholder="Enter interface name (e.g. Gi0/1)..."
                value={customSourcePort}
                onChange={(e) => setCustomSourcePort(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
              />
            )}
          </div>

          {/* Target Equipment */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Target: {targetShape.name || targetShape.text || 'Equipment B'}
            </label>
            {targetPorts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={selectedTargetPortId}
                  onChange={(e) => {
                    setSelectedTargetPortId(e.target.value);
                    if (e.target.value) setCustomTargetPort('');
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
                >
                  <option value="">-- Select Configured Interface --</option>
                  {targetPorts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} {p.ipAddress ? `(${p.ipAddress})` : ''}{' '}
                      {p.vlan ? `[VLAN ${p.vlan}]` : ''}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Or enter custom name..."
                  value={customTargetPort}
                  onChange={(e) => {
                    setCustomTargetPort(e.target.value);
                    if (e.target.value) setSelectedTargetPortId('');
                  }}
                  disabled={!!selectedTargetPortId}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow disabled:opacity-50"
                />
              </div>
            ) : (
              <input
                type="text"
                placeholder="Enter interface name (e.g. Gi0/2)..."
                value={customTargetPort}
                onChange={(e) => setCustomTargetPort(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
              />
            )}
          </div>
        </div>

        <footer className="px-6 py-4 border-t border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/30 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConnect}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transition-all"
          >
            Create Link
          </button>
        </footer>
      </div>
    </div>
  );
}
