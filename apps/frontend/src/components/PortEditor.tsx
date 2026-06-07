import { useState } from 'react';
import { useStore } from '../state/store';
import type { ShapePort, PortMediaType } from '../types/diagram';

export function PortEditor({
  shapeId,
  onClose,
}: {
  shapeId: string;
  onClose: () => void;
}): JSX.Element | null {
  const shape = useStore((s) => s.diagram.shapes.find((x) => x.id === shapeId));
  const updateShape = useStore((s) => s.updateShape);

  if (!shape) return null;

  const ports = shape.ports || [];

  const [newLabel, setNewLabel] = useState('');
  const [newMediaType, setNewMediaType] = useState<PortMediaType>('copper');
  const [newX, setNewX] = useState(0.5);
  const [newY, setNewY] = useState(1.0);

  const handleAddPort = () => {
    if (!newLabel.trim()) return;
    const newPort: ShapePort = {
      id: `custom-${Date.now()}`,
      label: newLabel.trim(),
      x: newX,
      y: newY,
      mediaType: newMediaType,
    };
    updateShape(shapeId, { ports: [...ports, newPort] });
    setNewLabel('');
  };

  const handleRemovePort = (portId: string) => {
    const nextPorts = ports.filter((p) => p.id !== portId);
    updateShape(shapeId, { ports: nextPorts });
  };

  const handleUpdatePort = (portId: string, patch: Partial<ShapePort>) => {
    const nextPorts = ports.map((p) => (p.id === portId ? { ...p, ...patch } : p));
    updateShape(shapeId, { ports: nextPorts });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="w-[600px] max-w-[92vw] max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-lg shadow-xl text-slate-800 dark:text-slate-200">
        <header className="px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-semibold">
            Manage Ports for {shape.name || shape.text || shape.type}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-xl"
          >
            ×
          </button>
        </header>

        <div className="p-4 space-y-4">
          {/* Add Port Form */}
          <section className="p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-250 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Add New Connection Port
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs">
                <span>Port Label (e.g. Gi0/4, WAN)</span>
                <input
                  type="text"
                  placeholder="Gi0/4"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="px-2 py-1 h-8 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span>Media Type</span>
                <select
                  value={newMediaType}
                  onChange={(e) => setNewMediaType(e.target.value as PortMediaType)}
                  className="px-2 py-1 h-8 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  <option value="copper">Copper (RJ45)</option>
                  <option value="fiber">Fiber Optic</option>
                  <option value="sfp">SFP Uplink</option>
                  <option value="console">Console</option>
                  <option value="usb">USB</option>
                  <option value="radio">Radio/Wireless</option>
                  <option value="logical">Logical Interface</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs">
                <span>X Relative Position ({Math.round(newX * 100)}%)</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={newX}
                  onChange={(e) => setNewX(parseFloat(e.target.value))}
                  className="h-8"
                />
                <span className="text-[10px] text-slate-400">
                  0 = Left edge, 0.5 = Center, 1 = Right edge
                </span>
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span>Y Relative Position ({Math.round(newY * 100)}%)</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={newY}
                  onChange={(e) => setNewY(parseFloat(e.target.value))}
                  className="h-8"
                />
                <span className="text-[10px] text-slate-400">
                  0 = Top edge, 0.5 = Center, 1 = Bottom edge
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleAddPort}
              className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-xs transition-colors"
            >
              Add Port
            </button>
          </section>

          {/* Current Ports List */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Configured Ports ({ports.length})
            </h3>
            {ports.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No ports configured on this device yet.
              </p>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded divide-y divide-slate-200 dark:divide-slate-800 max-h-[40vh] overflow-y-auto">
                {ports.map((port) => (
                  <div
                    key={port.id}
                    className="p-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 grid grid-cols-4 gap-2 items-center">
                      {/* Port Label */}
                      <input
                        type="text"
                        value={port.label}
                        onChange={(e) => handleUpdatePort(port.id, { label: e.target.value })}
                        className="px-1.5 py-0.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-700 bg-transparent hover:bg-white dark:hover:bg-slate-950 font-bold"
                      />

                      {/* Media */}
                      <select
                        value={port.mediaType ?? 'copper'}
                        onChange={(e) =>
                          handleUpdatePort(port.id, { mediaType: e.target.value as PortMediaType })
                        }
                        className="px-1 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                      >
                        <option value="copper">Copper</option>
                        <option value="fiber">Fiber</option>
                        <option value="sfp">SFP</option>
                        <option value="console">Console</option>
                        <option value="usb">USB</option>
                        <option value="radio">Radio</option>
                        <option value="logical">Logical</option>
                      </select>

                      {/* Position X Slider */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-400">
                          X: {Math.round(port.x * 100)}%
                        </span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={port.x}
                          onChange={(e) =>
                            handleUpdatePort(port.id, { x: parseFloat(e.target.value) })
                          }
                          className="h-3"
                        />
                      </div>

                      {/* Position Y Slider */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-400">
                          Y: {Math.round(port.y * 100)}%
                        </span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={port.y}
                          onChange={(e) =>
                            handleUpdatePort(port.id, { y: parseFloat(e.target.value) })
                          }
                          className="h-3"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePort(port.id)}
                      className="px-2 py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded border border-transparent hover:border-red-200"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
