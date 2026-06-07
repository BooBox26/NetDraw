// Right sidebar showing properties of the current selection.

import { useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { applySnap } from '../state/store';
import type { Connector, Shape } from '../types/diagram';
import { library } from '../shapes/library';
import { PalettePicker } from './PalettePicker';

export function PropertiesPanel(): JSX.Element {
  const shapes = useStore((s) => s.diagram.shapes);
  const connectors = useStore((s) => s.diagram.connectors);
  const selection = useStore((s) => s.ui.selection);
  const updateShape = useStore((s) => s.updateShape);
  const updateConnector = useStore((s) => s.updateConnector);
  const page = useStore((s) => s.diagram.page);
  const updatePage = useStore((s) => s.updatePage);

  const selectedShape = useMemo<Shape | null>(() => {
    if (selection.shapeIds.size === 0) return null;
    return shapes.find((s) => selection.shapeIds.has(s.id)) ?? null;
  }, [shapes, selection.shapeIds]);
  const selectedConnector = useMemo<Connector | null>(() => {
    if (selection.connectorIds.size === 0) return null;
    return connectors.find((c) => selection.connectorIds.has(c.id)) ?? null;
  }, [connectors, selection.connectorIds]);

  return (
    <aside className="nd-no-print z-20 w-72 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-full">
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200">
        Properties
      </div>
      <div className="flex-1 overflow-y-auto nd-scroll p-3 space-y-4 text-sm">
        {selection.shapeIds.size > 1 ? (
          <MultiSelectionProperties shapeIds={selection.shapeIds} />
        ) : selectedShape ? (
          <ShapeProperties shape={selectedShape} updateShape={updateShape} />
        ) : selectedConnector ? (
          <ConnectorProperties connector={selectedConnector} updateConnector={updateConnector} />
        ) : (
          <PageProperties page={page} updatePage={updatePage} />
        )}
      </div>
    </aside>
  );
}

function MultiSelectionProperties({ shapeIds }: { shapeIds: Set<string> }): JSX.Element {
  const shapes = useStore((s) => s.diagram.shapes);
  const alignSelected = useStore((s) => s.alignSelected);
  const updateShapes = useStore((s) => s.updateShapes);
  const idArray = useMemo(() => Array.from(shapeIds), [shapeIds]);

  const selectedShapes = useMemo(
    () => shapes.filter((s) => shapeIds.has(s.id)),
    [shapes, shapeIds]
  );

  const commonFill = useMemo(() => {
    const first = selectedShapes[0]?.style.fill;
    return selectedShapes.every((s) => s.style.fill === first) ? first : '#ffffff';
  }, [selectedShapes]);

  const commonStroke = useMemo(() => {
    const first = selectedShapes[0]?.style.stroke;
    return selectedShapes.every((s) => s.style.stroke === first) ? first : '#1f2937';
  }, [selectedShapes]);

  const commonStrokeWidth = useMemo(() => {
    const first = selectedShapes[0]?.style.strokeWidth;
    return selectedShapes.every((s) => s.style.strokeWidth === first) ? first : 1.5;
  }, [selectedShapes]);

  const commonOpacity = useMemo(() => {
    const first = selectedShapes[0]?.style.opacity;
    return selectedShapes.every((s) => s.style.opacity === first) ? first : 1;
  }, [selectedShapes]);

  const commonSite = useMemo(() => {
    const first = selectedShapes[0]?.metadata?.site;
    return selectedShapes.every((s) => s.metadata?.site === first) ? first : '';
  }, [selectedShapes]);

  const commonRole = useMemo(() => {
    const first = selectedShapes[0]?.metadata?.role;
    return selectedShapes.every((s) => s.metadata?.role === first) ? first : '';
  }, [selectedShapes]);

  const commonEnv = useMemo(() => {
    const first = selectedShapes[0]?.metadata?.env;
    return selectedShapes.every((s) => s.metadata?.env === first) ? first : '';
  }, [selectedShapes]);

  const handleStyleChange = (patch: Partial<Shape['style']>) => {
    updateShapes(idArray, { style: patch } as any);
  };

  const handleMetadataChange = (key: string, val: string) => {
    const patch: Partial<Shape> = {
      metadata: { [key]: val },
    };
    updateShapes(idArray, patch);
  };

  return (
    <>
      <div className="font-semibold text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
        Multi-Selection ({shapeIds.size} shapes)
      </div>

      <Section title="Alignment & Layout">
        <div className="grid grid-cols-2 gap-1.5 text-center text-xs">
          <button
            type="button"
            onClick={() => alignSelected('left')}
            className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px]"
          >
            Align Left
          </button>
          <button
            type="button"
            onClick={() => alignSelected('center-x')}
            className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px]"
          >
            Center X
          </button>
          <button
            type="button"
            onClick={() => alignSelected('right')}
            className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px]"
          >
            Align Right
          </button>
          <button
            type="button"
            onClick={() => alignSelected('top')}
            className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px]"
          >
            Align Top
          </button>
          <button
            type="button"
            onClick={() => alignSelected('center-y')}
            className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px]"
          >
            Center Y
          </button>
          <button
            type="button"
            onClick={() => alignSelected('bottom')}
            className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px]"
          >
            Align Bottom
          </button>
          <button
            type="button"
            disabled={shapeIds.size < 3}
            onClick={() => alignSelected('distribute-h')}
            className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] disabled:opacity-40"
            title="Distribute horizontally"
          >
            Distribute H
          </button>
          <button
            type="button"
            disabled={shapeIds.size < 3}
            onClick={() => alignSelected('distribute-v')}
            className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] disabled:opacity-40"
            title="Distribute vertically"
          >
            Distribute V
          </button>
        </div>
      </Section>

      <Section title="Bulk Style">
        <ColorRow
          label="Fill"
          value={commonFill ?? '#ffffff'}
          onChange={(c) => handleStyleChange({ fill: c })}
        />
        <ColorRow
          label="Stroke"
          value={commonStroke ?? '#1f2937'}
          onChange={(c) => handleStyleChange({ stroke: c })}
        />
        <NumberField
          label="Width"
          value={commonStrokeWidth}
          onChange={(v) => handleStyleChange({ strokeWidth: Math.max(0, v) })}
          step={0.5}
        />
        <label className="flex flex-col gap-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Opacity</span>
            <span>{Math.round(commonOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={commonOpacity}
            onChange={(e) => handleStyleChange({ opacity: parseFloat(e.currentTarget.value) })}
            className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
        </label>
      </Section>

      <Section title="Bulk Metadata">
        <TextField
          label="Site"
          value={commonSite ?? ''}
          onChange={(v) => handleMetadataChange('site', v)}
        />
        <TextField
          label="Role"
          value={commonRole ?? ''}
          onChange={(v) => handleMetadataChange('role', v)}
        />
        <TextField
          label="Env"
          value={commonEnv ?? ''}
          onChange={(v) => handleMetadataChange('env', v)}
        />
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <fieldset className="space-y-2 border border-slate-200 dark:border-slate-800 rounded p-2">
      <legend className="px-1 text-xs uppercase tracking-wide text-slate-500">{title}</legend>
      {children}
    </fieldset>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}): JSX.Element {
  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span className="text-slate-500 dark:text-slate-400 w-12">{label}</span>
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}
        onChange={(e) => onChange(parseFloat(e.currentTarget.value) || 0)}
        className="flex-1 h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-right"
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}): JSX.Element {
  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span className="text-slate-500 dark:text-slate-400 w-12">{label}</span>
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="flex-1 h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
      />
    </label>
  );
}

function ShapeProperties({
  shape,
  updateShape,
}: {
  shape: Shape;
  updateShape: (id: string, patch: Partial<Shape>, options?: { record?: boolean }) => void;
}): JSX.Element {
  const plugin = library.find((it) => it.plugin.type === shape.type)?.plugin;
  const snap = useStore((s) => s.ui.snap);
  const grid = useStore((s) => s.diagram.page.gridSize);
  const hasColorSlots = plugin?.colorSlots && plugin.colorSlots.length > 0;
  const groupedSlots = (() => {
    if (!plugin || !plugin.colorSlots) return {};
    const out: Record<string, any[]> = {};
    for (const slot of plugin.colorSlots) {
      const g = slot.group ?? 'Theme';
      if (!out[g]) out[g] = [];
      out[g].push(slot);
    }
    return out;
  })();
  return (
    <>
      <Section title="Identity">
        <TextField label="Type" value={plugin?.label ?? shape.type} onChange={() => undefined} />
        <TextField
          label="Text"
          value={shape.text ?? ''}
          onChange={(v) => updateShape(shape.id, { text: v })}
        />
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Markdown (bold, italic, [link](url))
          </span>
          <textarea
            value={shape.markdown ?? ''}
            onChange={(e) => updateShape(shape.id, { markdown: e.currentTarget.value })}
            rows={3}
            placeholder="**bold** *italic* [docs](https://...)"
            className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px]"
          />
        </label>
        <TextField
          label="Link"
          value={shape.link ?? ''}
          onChange={(v) => updateShape(shape.id, { link: v || undefined })}
        />
        <TextField
          label="Name"
          value={shape.name ?? ''}
          onChange={(v) => updateShape(shape.id, { name: v })}
        />
        <label className="flex items-center gap-2 text-xs py-1 mt-1 border-t border-slate-100 dark:border-slate-800/50">
          <input
            type="checkbox"
            checked={Boolean(shape.locked)}
            onChange={(e) => updateShape(shape.id, { locked: e.currentTarget.checked })}
          />
          <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1">
            🔒 Locked (verrouillé)
          </span>
        </label>
      </Section>
      {plugin?.category === 'network' && (
        <>
          <Section title="Network Asset (Fiche Équipement)">
            <TextField
              label="Hostname"
              value={shape.device?.hostname ?? shape.metadata?.hostname ?? ''}
              onChange={(v) =>
                updateShape(shape.id, {
                  device: { ...(shape.device || {}), hostname: v },
                  metadata: { ...(shape.metadata || {}), hostname: v },
                })
              }
            />
            <label className="flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400 w-12">Role</span>
              <select
                value={shape.device?.role ?? 'generic'}
                onChange={(e) =>
                  updateShape(shape.id, {
                    device: { ...(shape.device || {}), role: e.target.value as any },
                  })
                }
                className="flex-1 h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="generic">Generic/None</option>
                <option value="core">Core</option>
                <option value="distribution">Distribution</option>
                <option value="access">Access</option>
                <option value="edge">Edge</option>
                <option value="pe">Provider Edge (PE)</option>
                <option value="ce">Customer Edge (CE)</option>
                <option value="spine">Spine</option>
                <option value="leaf">Leaf</option>
                <option value="border">Border</option>
                <option value="transit">Transit</option>
                <option value="management">Management</option>
              </select>
            </label>
            <TextField
              label="Vendor"
              value={shape.device?.vendor ?? shape.metadata?.vendor ?? ''}
              onChange={(v) =>
                updateShape(shape.id, {
                  device: { ...(shape.device || {}), vendor: v },
                  metadata: { ...(shape.metadata || {}), vendor: v },
                })
              }
            />
            <TextField
              label="Model"
              value={shape.device?.model ?? shape.metadata?.model ?? ''}
              onChange={(v) =>
                updateShape(shape.id, {
                  device: { ...(shape.device || {}), model: v },
                  metadata: { ...(shape.metadata || {}), model: v },
                })
              }
            />
            <div className="grid grid-cols-2 gap-2">
              <TextField
                label="OS"
                value={shape.device?.osName ?? ''}
                onChange={(v) =>
                  updateShape(shape.id, { device: { ...(shape.device || {}), osName: v } })
                }
              />
              <TextField
                label="OS Ver"
                value={shape.device?.osVersion ?? ''}
                onChange={(v) =>
                  updateShape(shape.id, { device: { ...(shape.device || {}), osVersion: v } })
                }
              />
            </div>
            <TextField
              label="Serial"
              value={shape.device?.serialNumber ?? shape.metadata?.serial ?? ''}
              onChange={(v) =>
                updateShape(shape.id, {
                  device: { ...(shape.device || {}), serialNumber: v },
                  metadata: { ...(shape.metadata || {}), serial: v },
                })
              }
            />
            <label className="flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400 w-12">Status</span>
              <select
                value={shape.device?.status ?? 'active'}
                onChange={(e) =>
                  updateShape(shape.id, {
                    device: { ...(shape.device || {}), status: e.target.value as any },
                  })
                }
                className="flex-1 h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="planned">Planned (Planifié)</option>
                <option value="staging">Staging (Préparation)</option>
                <option value="active">Active (Actif)</option>
                <option value="deprecated">Deprecated</option>
                <option value="retired">Retired (Retiré)</option>
                <option value="unknown">Unknown</option>
              </select>
            </label>
            <TextField
              label="Owner"
              value={shape.device?.owner ?? ''}
              onChange={(v) =>
                updateShape(shape.id, { device: { ...(shape.device || {}), owner: v } })
              }
            />
            <TextField
              label="Tags"
              value={(shape.device?.tags || []).join(', ')}
              onChange={(v) =>
                updateShape(shape.id, {
                  device: {
                    ...(shape.device || {}),
                    tags: v
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean),
                  },
                })
              }
            />
          </Section>

          <Section title="HA Cluster & Failover">
            <label className="flex items-center gap-2 text-xs py-1">
              <input
                type="checkbox"
                checked={Boolean(shape.device?.isHACluster)}
                onChange={(e) =>
                  updateShape(shape.id, {
                    device: { ...(shape.device || {}), isHACluster: e.target.checked },
                  })
                }
              />
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Is HA Cluster Pair?
              </span>
            </label>
            {shape.device?.isHACluster && (
              <label className="flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400 w-12">HA Mode</span>
                <select
                  value={shape.device?.haMode ?? 'active-passive'}
                  onChange={(e) =>
                    updateShape(shape.id, {
                      device: { ...(shape.device || {}), haMode: e.target.value as any },
                    })
                  }
                  className="flex-1 h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="active-passive">Active / Passive</option>
                  <option value="active-active">Active / Active</option>
                </select>
              </label>
            )}
          </Section>

          <Section title="Structured Ports (IP/VLAN)">
            <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
              {shape.ports && shape.ports.length > 0 ? (
                shape.ports.map((port) => (
                  <div
                    key={port.id}
                    className="p-2 border border-slate-100 dark:border-slate-800 rounded bg-slate-50/40 dark:bg-slate-950/20 text-xs space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{port.label}</span>
                      <label className="flex items-center gap-1 text-[10px]">
                        <input
                          type="checkbox"
                          checked={Boolean(port.visibleOnDiagram)}
                          onChange={(e) => {
                            const nextPorts =
                              shape.ports?.map((p) =>
                                p.id === port.id ? { ...p, visibleOnDiagram: e.target.checked } : p
                              ) || [];
                            updateShape(shape.id, { ports: nextPorts });
                          }}
                        />
                        <span>Visible label</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        placeholder="IP Address"
                        value={port.ipAddress ?? ''}
                        onChange={(e) => {
                          const nextPorts =
                            shape.ports?.map((p) =>
                              p.id === port.id ? { ...p, ipAddress: e.target.value } : p
                            ) || [];
                          updateShape(shape.id, { ports: nextPorts });
                        }}
                        className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-[10px]"
                      />
                      <input
                        type="text"
                        placeholder="VLAN"
                        value={port.vlan ?? ''}
                        onChange={(e) => {
                          const nextPorts =
                            shape.ports?.map((p) =>
                              p.id === port.id ? { ...p, vlan: e.target.value } : p
                            ) || [];
                          updateShape(shape.id, { ports: nextPorts });
                        }}
                        className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-[10px]"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Description"
                      value={port.description ?? ''}
                      onChange={(e) => {
                        const nextPorts =
                          shape.ports?.map((p) =>
                            p.id === port.id ? { ...p, description: e.target.value } : p
                          ) || [];
                        updateShape(shape.id, { ports: nextPorts });
                      }}
                      className="w-full px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[10px]"
                    />
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-slate-450 italic">
                  Use &quot;Manage ports...&quot; from right-click context menu to add structured
                  interfaces.
                </p>
              )}
            </div>
          </Section>

          <Section title="Modules & Line Cards">
            <div className="space-y-2">
              {(shape.device?.modules || []).map((m) => (
                <div
                  key={m.id}
                  className="flex justify-between items-center p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-[11px]"
                >
                  <span>
                    Slot {m.slotNumber}: <strong>{m.name}</strong> ({m.model || 'Generic'})
                  </span>
                  <button
                    onClick={() => {
                      const nextMod = (shape.device?.modules || []).filter((it) => it.id !== m.id);
                      updateShape(shape.id, {
                        device: { ...(shape.device || {}), modules: nextMod },
                      });
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newMod = {
                    id: `mod-${Date.now()}`,
                    name: 'Supervisor 1G',
                    slotNumber: `${(shape.device?.modules || []).length}`,
                    model: 'SUP-1G',
                  };
                  updateShape(shape.id, {
                    device: {
                      ...(shape.device || {}),
                      modules: [...(shape.device?.modules || []), newMod],
                    },
                  });
                }}
                className="w-full h-7 border border-dashed border-slate-350 dark:border-slate-700 text-slate-500 hover:text-slate-700 text-[11px] rounded transition-colors"
              >
                + Add Supervisor/Module
              </button>
            </div>
          </Section>

          <Section title="Stacking / Virtual Chassis">
            <div className="space-y-2">
              {(shape.device?.stackMembers || []).map((sm) => (
                <div
                  key={sm.id}
                  className="flex justify-between items-center p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-[11px]"
                >
                  <span>
                    Unit {sm.memberId}: <strong>{sm.hostname}</strong> ({sm.role})
                  </span>
                  <button
                    onClick={() => {
                      const nextMembers = (shape.device?.stackMembers || []).filter(
                        (it) => it.id !== sm.id
                      );
                      updateShape(shape.id, {
                        device: { ...(shape.device || {}), stackMembers: nextMembers },
                      });
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newMember = {
                    id: `sm-${Date.now()}`,
                    hostname: `${shape.device?.hostname || 'switch'}-unit-${(shape.device?.stackMembers || []).length + 1}`,
                    memberId: (shape.device?.stackMembers || []).length + 1,
                    role: ((shape.device?.stackMembers || []).length === 0
                      ? 'master'
                      : 'member') as any,
                  };
                  updateShape(shape.id, {
                    device: {
                      ...(shape.device || {}),
                      stackMembers: [...(shape.device?.stackMembers || []), newMember],
                    },
                  });
                }}
                className="w-full h-7 border border-dashed border-slate-350 dark:border-slate-700 text-slate-500 hover:text-slate-700 text-[11px] rounded transition-colors"
              >
                + Add Stack Member
              </button>
            </div>
          </Section>
        </>
      )}
      <Section title="Metadata (key/value)">
        <MetadataEditor
          value={shape.metadata ?? {}}
          onChange={(m) => updateShape(shape.id, { metadata: m })}
        />
      </Section>
      <Section title="Geometry">
        <NumberField
          label="X"
          value={shape.x}
          onChange={(v) => updateShape(shape.id, applySnap({ x: v }, grid, snap))}
        />
        <NumberField
          label="Y"
          value={shape.y}
          onChange={(v) => updateShape(shape.id, applySnap({ y: v }, grid, snap))}
        />
        <NumberField
          label="W"
          value={shape.width}
          onChange={(v) => updateShape(shape.id, { width: Math.max(8, v) })}
        />
        <NumberField
          label="H"
          value={shape.height}
          onChange={(v) => updateShape(shape.id, { height: Math.max(8, v) })}
        />
        <NumberField
          label="Rot"
          value={shape.rotation}
          onChange={(v) => updateShape(shape.id, { rotation: v })}
        />
      </Section>
      {hasColorSlots && (
        <>
          {Object.entries(groupedSlots).map(([groupName, slots]) => (
            <Section key={groupName} title={`${groupName} (vectors)`}>
              {slots.map((slot) => (
                <ColorRow
                  key={slot.id}
                  label={slot.label}
                  value={shape.style.theme?.[slot.id] ?? slot.default}
                  onChange={(c) =>
                    updateShape(shape.id, {
                      style: { ...shape.style, theme: { ...shape.style.theme, [slot.id]: c } },
                    })
                  }
                />
              ))}
            </Section>
          ))}
          <Section title="Gradient">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={Boolean(shape.style.gradient)}
                onChange={(e) => {
                  if (e.currentTarget.checked) {
                    updateShape(shape.id, {
                      style: {
                        ...shape.style,
                        gradient: {
                          type: 'linear',
                          angle: 90,
                          stops: [
                            { offset: 0, color: shape.style.theme?.body ?? '#ffffff' },
                            { offset: 1, color: shape.style.theme?.accent ?? '#0f172a' },
                          ],
                        },
                      },
                    });
                  } else {
                    const { gradient: _g, ...rest } = shape.style;
                    updateShape(shape.id, { style: rest as typeof shape.style });
                  }
                }}
              />
              <span>Apply gradient to body</span>
            </label>
            {shape.style.gradient && (
              <>
                <label className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 w-12">Type</span>
                  <select
                    value={shape.style.gradient.type}
                    onChange={(e) =>
                      updateShape(shape.id, {
                        style: {
                          ...shape.style,
                          gradient: {
                            ...shape.style.gradient!,
                            type: e.currentTarget.value as 'linear' | 'radial',
                          },
                        },
                      })
                    }
                    className="flex-1 h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="linear">Linear</option>
                    <option value="radial">Radial</option>
                  </select>
                </label>
                {shape.style.gradient.type === 'linear' && (
                  <NumberField
                    label="Angle"
                    value={shape.style.gradient.angle ?? 90}
                    onChange={(v) =>
                      updateShape(shape.id, {
                        style: {
                          ...shape.style,
                          gradient: {
                            ...shape.style.gradient!,
                            angle: Math.max(0, Math.min(360, v)),
                          },
                        },
                      })
                    }
                  />
                )}
                <div className="text-[11px] text-slate-500 mt-1">Stops</div>
                {shape.style.gradient.stops.map((stop, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={stop.color}
                      onChange={(e) => {
                        const stops = [...shape.style.gradient!.stops];
                        stops[i] = { ...stops[i], color: e.currentTarget.value };
                        updateShape(shape.id, {
                          style: { ...shape.style, gradient: { ...shape.style.gradient!, stops } },
                        });
                      }}
                      className="h-6 w-8 rounded border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={stop.offset}
                      onChange={(e) => {
                        const stops = [...shape.style.gradient!.stops];
                        stops[i] = { ...stops[i], offset: parseFloat(e.currentTarget.value) };
                        updateShape(shape.id, {
                          style: { ...shape.style, gradient: { ...shape.style.gradient!, stops } },
                        });
                      }}
                      className="flex-1"
                    />
                    <span className="text-[10px] text-slate-500 w-8 text-right">
                      {Math.round(stop.offset * 100)}%
                    </span>
                    {shape.style.gradient!.stops.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const stops = shape.style.gradient!.stops.filter((_, j) => j !== i);
                          updateShape(shape.id, {
                            style: {
                              ...shape.style,
                              gradient: { ...shape.style.gradient!, stops },
                            },
                          });
                        }}
                        className="w-5 h-5 inline-flex items-center justify-center text-slate-400 hover:text-rose-500"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const stops = [
                      ...shape.style.gradient!.stops,
                      { offset: 0.5, color: '#888888' },
                    ];
                    updateShape(shape.id, {
                      style: { ...shape.style, gradient: { ...shape.style.gradient!, stops } },
                    });
                  }}
                  className="h-6 px-2 text-xs rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  + Add stop
                </button>
                <div
                  className="mt-1 h-6 rounded border border-slate-200 dark:border-slate-700"
                  style={{
                    background:
                      shape.style.gradient.type === 'linear'
                        ? `linear-gradient(${shape.style.gradient.angle ?? 90}deg, ${shape.style.gradient.stops
                            .map((s) => `${s.color} ${Math.round(s.offset * 100)}%`)
                            .join(', ')})`
                        : `radial-gradient(circle, ${shape.style.gradient.stops
                            .map((s) => `${s.color} ${Math.round(s.offset * 100)}%`)
                            .join(', ')})`,
                  }}
                />
              </>
            )}
          </Section>
        </>
      )}
      <Section title="Style">
        <ColorRow
          label="Fill"
          value={shape.style.fill}
          onChange={(c) => updateShape(shape.id, { style: { ...shape.style, fill: c } })}
        />
        <ColorRow
          label="Stroke"
          value={shape.style.stroke}
          onChange={(c) => updateShape(shape.id, { style: { ...shape.style, stroke: c } })}
        />
        <NumberField
          label="Width"
          value={shape.style.strokeWidth}
          onChange={(v) =>
            updateShape(shape.id, { style: { ...shape.style, strokeWidth: Math.max(0, v) } })
          }
        />
        <NumberField
          label="Opacity"
          step={0.1}
          value={shape.style.opacity}
          onChange={(v) =>
            updateShape(shape.id, {
              style: { ...shape.style, opacity: Math.min(1, Math.max(0, v)) },
            })
          }
        />
        <DashField
          value={shape.style.strokeDasharray}
          onChange={(v) => updateShape(shape.id, { style: { ...shape.style, strokeDasharray: v } })}
        />
      </Section>
      <Section title="Text">
        <NumberField
          label="Size"
          value={shape.style.fontSize ?? 14}
          onChange={(v) =>
            updateShape(shape.id, { style: { ...shape.style, fontSize: Math.max(6, v) } })
          }
        />
        <NumberField
          label="Weight"
          value={shape.style.fontWeight ?? 500}
          onChange={(v) =>
            updateShape(shape.id, { style: { ...shape.style, fontWeight: Math.max(100, v) } })
          }
        />
        <label className="flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 w-12">Align</span>
          <select
            value={shape.style.textAlign ?? 'left'}
            onChange={(e) =>
              updateShape(shape.id, {
                style: {
                  ...shape.style,
                  textAlign: e.currentTarget.value as 'left' | 'center' | 'right',
                },
              })
            }
            className="flex-1 h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>
        <div className="flex items-center justify-between text-xs py-1 border-t border-slate-100 dark:border-slate-800/50 mt-2 pt-2">
          <span className="text-slate-500 dark:text-slate-400 w-12">Format</span>
          <div className="flex gap-1.5 flex-1">
            <button
              type="button"
              onClick={() => {
                const isBold = (shape.style.fontWeight ?? 500) > 600;
                updateShape(shape.id, {
                  style: { ...shape.style, fontWeight: isBold ? 500 : 700 },
                });
              }}
              className={`w-7 h-7 rounded border font-bold flex items-center justify-center transition-all ${
                (shape.style.fontWeight ?? 500) > 600
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-400'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              title="Bold"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => {
                const isItalic = shape.style.fontStyle === 'italic';
                updateShape(shape.id, {
                  style: { ...shape.style, fontStyle: isItalic ? 'normal' : 'italic' },
                });
              }}
              className={`w-7 h-7 rounded border italic flex items-center justify-center transition-all ${
                shape.style.fontStyle === 'italic'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-400'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              title="Italic"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => {
                const isUnderline = shape.style.textDecoration === 'underline';
                updateShape(shape.id, {
                  style: { ...shape.style, textDecoration: isUnderline ? 'none' : 'underline' },
                });
              }}
              className={`w-7 h-7 rounded border underline flex items-center justify-center transition-all ${
                shape.style.textDecoration === 'underline'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-400'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              title="Underline"
            >
              U
            </button>
          </div>
        </div>
        <ColorRow
          label="Color"
          value={shape.style.textColor || shape.style.stroke || '#1f2937'}
          onChange={(c) => updateShape(shape.id, { style: { ...shape.style, textColor: c } })}
        />
      </Section>
    </>
  );
}

function ConnectorProperties({
  connector,
  updateConnector,
}: {
  connector: Connector;
  updateConnector: (id: string, patch: Partial<Connector>, options?: { record?: boolean }) => void;
}): JSX.Element {
  const shapes = useStore((s) => s.diagram.shapes);

  const sourceShape = useMemo(
    () => (connector.sourceId ? (shapes.find((s) => s.id === connector.sourceId) ?? null) : null),
    [shapes, connector.sourceId]
  );

  const targetShape = useMemo(
    () => (connector.targetId ? (shapes.find((s) => s.id === connector.targetId) ?? null) : null),
    [shapes, connector.targetId]
  );

  return (
    <>
      <Section title="Identity">
        <TextField
          label="Label"
          value={connector.label ?? ''}
          onChange={(v) => updateConnector(connector.id, { label: v })}
        />
      </Section>

      <Section title="Geometry">
        <label className="flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 w-16">Type</span>
          <select
            value={connector.type}
            onChange={(e) =>
              updateConnector(connector.id, { type: e.currentTarget.value as Connector['type'] })
            }
            className="flex-1 h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="straight">Straight</option>
            <option value="orthogonal">Orthogonal (A*)</option>
            <option value="bezier">Bezier</option>
            <option value="bus">Bus Bar</option>
            <option value="bundle">Cable Bundle</option>
            <option value="radio">Radio/Wireless Link</option>
            <option value="logical">Logical Overlay</option>
          </select>
        </label>
        <label className="flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 w-16">Arrows</span>
          <select
            value={connector.arrows}
            onChange={(e) =>
              updateConnector(connector.id, {
                arrows: e.currentTarget.value as Connector['arrows'],
              })
            }
            className="flex-1 h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="none">None</option>
            <option value="forward">Forward</option>
            <option value="backward">Backward</option>
            <option value="both">Both</option>
          </select>
        </label>
      </Section>

      <Section title="Appearance">
        <label className="flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 w-16">Color</span>
          <div className="flex-1 flex gap-2 items-center">
            <input
              type="color"
              value={connector.style?.stroke ?? '#1f2937'}
              onChange={(e) =>
                updateConnector(connector.id, {
                  style: {
                    ...(connector.style || {}),
                    stroke: e.target.value,
                  },
                })
              }
              className="w-8 h-7 p-0.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent cursor-pointer"
            />
            <input
              type="text"
              value={connector.style?.stroke ?? ''}
              placeholder="Auto / Preset"
              onChange={(e) =>
                updateConnector(connector.id, {
                  style: {
                    ...(connector.style || {}),
                    stroke: e.target.value || (undefined as any),
                  },
                })
              }
              className="flex-1 h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            />
          </div>
        </label>

        <label className="flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 w-16">Thickness</span>
          <div className="flex-1 flex gap-2 items-center">
            <input
              type="range"
              min={1}
              max={8}
              step={0.5}
              value={connector.style?.strokeWidth ?? 1.5}
              onChange={(e) =>
                updateConnector(connector.id, {
                  style: {
                    ...(connector.style || {}),
                    strokeWidth: parseFloat(e.target.value),
                  },
                })
              }
              className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-slate-600 dark:text-slate-400 text-xs w-8 text-right font-mono">
              {connector.style?.strokeWidth ?? 1.5}px
            </span>
          </div>
        </label>

        <label className="flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 w-16">Line Style</span>
          <select
            value={
              connector.style?.strokeDasharray === undefined
                ? 'solid'
                : connector.style?.strokeDasharray === '8 4'
                  ? 'dashed'
                  : connector.style?.strokeDasharray === '2 4'
                    ? 'dotted'
                    : 'custom'
            }
            onChange={(e) => {
              const val = e.currentTarget.value;
              let dash: string | undefined = undefined;
              if (val === 'dashed') dash = '8 4';
              else if (val === 'dotted') dash = '2 4';
              updateConnector(connector.id, {
                style: {
                  ...(connector.style || {}),
                  strokeDasharray: dash,
                },
              });
            }}
            className="flex-1 h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>
        </label>

        <label className="flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 w-16">Arrow Style</span>
          <select
            value={connector.style?.pathData || 'arrow-black'}
            onChange={(e) =>
              updateConnector(connector.id, {
                style: {
                  ...(connector.style || {}),
                  pathData: e.currentTarget.value,
                },
              })
            }
            className="flex-1 h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
          >
            <option value="arrow-black">Standard Arrow</option>
            <option value="diamond">Diamond</option>
            <option value="dot">Circle/Dot</option>
            <option value="cross">Cross (X)</option>
            <option value="question">Question Mark</option>
          </select>
        </label>
      </Section>

      <Section title="Network Link">
        <label className="flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 w-12">Tech</span>
          <select
            value={connector.technology ?? 'generic'}
            onChange={(e) =>
              updateConnector(connector.id, {
                technology: e.currentTarget.value as Connector['technology'],
              })
            }
            className="flex-1 h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="generic">Generic</option>
            <option value="ethernet">Ethernet (Slate)</option>
            <option value="fiber">Fiber (Amber)</option>
            <option value="copper">Copper (Warm Gray)</option>
            <option value="coaxial">Coaxial (Brown)</option>
            <option value="radio">Radio (Purple Dot)</option>
            <option value="wifi">WiFi (Purple Space Dot)</option>
            <option value="vpn">VPN Tunnel (Green Dash)</option>
            <option value="mpls">MPLS (Blue Thick)</option>
            <option value="sd-wan">SD-WAN (Cyan Multi-Dash)</option>
            <option value="ipsec">IPsec (Red Double-Dash)</option>
            <option value="gre">GRE (Red Double-Dash)</option>
            <option value="vxlan">VXLAN (Purple Dot-Dash)</option>
            <option value="evpn">EVPN (Purple Dot-Dash)</option>
            <option value="internet">Internet (Gray Long-Dash)</option>
          </select>
        </label>
        <label className="flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 w-12">State</span>
          <select
            value={connector.linkState ?? 'active'}
            onChange={(e) =>
              updateConnector(connector.id, {
                linkState: e.currentTarget.value as Connector['linkState'],
              })
            }
            className="flex-1 h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="active">Active (Up)</option>
            <option value="backup">Backup (Dashed Outline)</option>
            <option value="down">Down (Red + X Midpoint)</option>
            <option value="planned">Planned (Gray Dash)</option>
            <option value="deprecated">Deprecated (Faded)</option>
            <option value="unknown">Unknown (Amber + ?)</option>
          </select>
        </label>
        <label className="flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 w-12">Layer</span>
          <select
            value={connector.linkLayer ?? 'physical'}
            onChange={(e) =>
              updateConnector(connector.id, {
                linkLayer: e.currentTarget.value as Connector['linkLayer'],
              })
            }
            className="flex-1 h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="physical">L1 Physical</option>
            <option value="logical">L2/L3 Logical</option>
          </select>
        </label>
      </Section>

      <Section title="Ports / Interfaces">
        {sourceShape && sourceShape.ports && sourceShape.ports.length > 0 ? (
          <label className="flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 w-12">Source</span>
            <select
              value={connector.sourcePort ?? ''}
              onChange={(e) => updateConnector(connector.id, { sourcePort: e.currentTarget.value })}
              className="flex-1 h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <option value="">(None)</option>
              {sourceShape.ports.map((p) => (
                <option key={p.id} value={p.label}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <TextField
            label="Source"
            value={connector.sourcePort ?? ''}
            onChange={(v) => updateConnector(connector.id, { sourcePort: v })}
          />
        )}

        {targetShape && targetShape.ports && targetShape.ports.length > 0 ? (
          <label className="flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 w-12">Target</span>
            <select
              value={connector.targetPort ?? ''}
              onChange={(e) => updateConnector(connector.id, { targetPort: e.currentTarget.value })}
              className="flex-1 h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <option value="">(None)</option>
              {targetShape.ports.map((p) => (
                <option key={p.id} value={p.label}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <TextField
            label="Target"
            value={connector.targetPort ?? ''}
            onChange={(v) => updateConnector(connector.id, { targetPort: v })}
          />
        )}
      </Section>

      <Section title="Capacity / Layer 3">
        <TextField
          label="Bandwidth"
          value={connector.capacity?.bandwidth ?? ''}
          onChange={(v) =>
            updateConnector(connector.id, { capacity: { ...connector.capacity, bandwidth: v } })
          }
        />
        <TextField
          label="VLAN"
          value={connector.capacity?.vlan ?? ''}
          onChange={(v) =>
            updateConnector(connector.id, { capacity: { ...connector.capacity, vlan: v } })
          }
        />
        <TextField
          label="Subnet"
          value={connector.capacity?.subnet ?? ''}
          onChange={(v) =>
            updateConnector(connector.id, { capacity: { ...connector.capacity, subnet: v } })
          }
        />
        <TextField
          label="Circuit ID"
          value={connector.capacity?.circuitId ?? ''}
          onChange={(v) =>
            updateConnector(connector.id, { capacity: { ...connector.capacity, circuitId: v } })
          }
        />
        <TextField
          label="Length"
          value={connector.capacity?.length ?? ''}
          onChange={(v) =>
            updateConnector(connector.id, { capacity: { ...connector.capacity, length: v } })
          }
        />
      </Section>

      {(connector.type === 'bundle' || connector.bundle) && (
        <Section title="Cable Bundle / LACP">
          <label className="flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 w-12">Aggregation</span>
            <select
              value={connector.bundle?.type ?? 'cable-bundle'}
              onChange={(e) =>
                updateConnector(connector.id, {
                  bundle: { ...(connector.bundle || {}), type: e.currentTarget.value as any },
                })
              }
              className="flex-1 h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <option value="cable-bundle">Cable Bundle</option>
              <option value="lag">LAG</option>
              <option value="lacp">LACP Port-Channel</option>
              <option value="trunk">Trunk</option>
              <option value="stack">Stacking Cable</option>
            </select>
          </label>
          <NumberField
            label="Members"
            value={connector.bundle?.memberCount ?? 2}
            onChange={(v) =>
              updateConnector(connector.id, {
                bundle: { ...(connector.bundle || {}), memberCount: Math.max(1, v) } as any,
              })
            }
          />
        </Section>
      )}
    </>
  );
}

function PageProperties({
  page,
  updatePage,
}: {
  page: ReturnType<typeof useStore.getState>['diagram']['page'];
  updatePage: (patch: Partial<typeof page>) => void;
}): JSX.Element {
  const pageMode = page.pageMode ?? 'infinite';
  const pageSize = page.pageSize ?? 'A4';
  const pageOrientation = page.pageOrientation ?? 'landscape';

  const handleModeChange = (mode: 'infinite' | 'printable') => {
    if (mode === 'printable') {
      const dims = getPageDimensions(pageSize, pageOrientation);
      updatePage({ pageMode: mode, width: dims.width, height: dims.height });
    } else {
      updatePage({ pageMode: mode });
    }
  };

  const handleSizeChange = (size: 'A4' | 'A3' | 'A2') => {
    const dims = getPageDimensions(size, pageOrientation);
    updatePage({ pageSize: size, width: dims.width, height: dims.height });
  };

  const handleOrientationChange = (orient: 'portrait' | 'landscape') => {
    const dims = getPageDimensions(pageSize, orient);
    updatePage({ pageOrientation: orient, width: dims.width, height: dims.height });
  };

  return (
    <>
      <Section title="Canvas Mode">
        <div className="flex flex-col gap-2 w-full text-xs">
          <select
            value={pageMode}
            onChange={(e) => handleModeChange(e.currentTarget.value as 'infinite' | 'printable')}
            className="w-full h-8 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="infinite">Infinite Canvas</option>
            <option value="printable">Printable Page Mode</option>
          </select>
        </div>
      </Section>

      {pageMode === 'printable' && (
        <Section title="Page Setup">
          <div className="flex flex-col gap-2 w-full text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">Size</span>
              <select
                value={pageSize}
                onChange={(e) => handleSizeChange(e.currentTarget.value as 'A4' | 'A3' | 'A2')}
                className="h-8 px-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="A4">A4 (21.0 × 29.7 cm)</option>
                <option value="A3">A3 (29.7 × 42.0 cm)</option>
                <option value="A2">A2 (42.0 × 59.4 cm)</option>
              </select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">Orientation</span>
              <select
                value={pageOrientation}
                onChange={(e) =>
                  handleOrientationChange(e.currentTarget.value as 'portrait' | 'landscape')
                }
                className="h-8 px-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
              </select>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1 text-right">
              Dimensions: {page.width} × {page.height} px
            </div>
          </div>
        </Section>
      )}

      {pageMode === 'infinite' && (
        <Section title="Virtual Size">
          <NumberField
            label="W"
            value={page.width}
            onChange={(v) => updatePage({ width: Math.max(100, v) })}
          />
          <NumberField
            label="H"
            value={page.height}
            onChange={(v) => updatePage({ height: Math.max(100, v) })}
          />
        </Section>
      )}

      <Section title="Style">
        <ColorRow
          label="Bg"
          value={page.background}
          onChange={(c) => updatePage({ background: c })}
        />
      </Section>
      <Section title="Grid">
        <NumberField
          label="Size"
          value={page.gridSize}
          onChange={(v) => updatePage({ gridSize: Math.max(2, v) })}
        />
      </Section>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
        Select a shape to edit its properties.
      </p>
    </>
  );
}

function getPageDimensions(
  size: 'A4' | 'A3' | 'A2',
  orientation: 'portrait' | 'landscape'
): { width: number; height: number } {
  const sizes = {
    A4: { portrait: { width: 794, height: 1123 }, landscape: { width: 1123, height: 794 } },
    A3: { portrait: { width: 1123, height: 1587 }, landscape: { width: 1587, height: 1123 } },
    A2: { portrait: { width: 1587, height: 2245 }, landscape: { width: 2245, height: 1587 } },
  };
  return sizes[size][orientation];
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (c: string) => void;
}): JSX.Element {
  const [mode, setMode] = useState<'palette' | 'custom'>('palette');
  return (
    <div className="text-xs">
      <div className="flex items-center justify-between mb-1">
        <span className="text-slate-500 dark:text-slate-400 w-12">{label}</span>
        <div className="flex items-center gap-1">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.currentTarget.value)}
            className="h-6 w-8 rounded border border-slate-200 dark:border-slate-700"
            aria-label={`${label} custom color`}
          />
          <input
            type="text"
            value={value}
            onChange={(e) => {
              const v = e.currentTarget.value;
              if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) onChange(v);
            }}
            className="h-6 w-16 px-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[10px]"
            aria-label={`${label} hex`}
          />
        </div>
      </div>
      <div className="flex gap-1 mb-1">
        <button
          type="button"
          onClick={() => setMode('palette')}
          className={`h-5 px-1.5 rounded text-[10px] ${
            mode === 'palette'
              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          Palettes
        </button>
        <button
          type="button"
          onClick={() => setMode('custom')}
          className={`h-5 px-1.5 rounded text-[10px] ${
            mode === 'custom'
              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          Custom
        </button>
      </div>
      {mode === 'palette' ? (
        <PalettePicker onPick={onChange} />
      ) : (
        <CustomColorPad value={value} onChange={onChange} />
      )}
    </div>
  );
}

// Custom picker pad — a curated set of swatches organized by hue family,
// so users can hand-pick a color without leaving the dialog.
function CustomColorPad({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}): JSX.Element {
  const hueSwatches: Record<string, string[]> = {
    Neutrals: ['#ffffff', '#f8fafc', '#e2e8f0', '#94a3b8', '#475569', '#0f172a'],
    Red: ['#fee2e2', '#fecaca', '#f87171', '#ef4444', '#dc2626', '#7f1d1d'],
    Orange: ['#ffedd5', '#fed7aa', '#fb923c', '#f97316', '#ea580c', '#7c2d12'],
    Yellow: ['#fef9c3', '#fde68a', '#facc15', '#eab308', '#ca8a04', '#713f12'],
    Green: ['#dcfce7', '#bbf7d0', '#4ade80', '#22c55e', '#16a34a', '#14532d'],
    Cyan: ['#cffafe', '#a5f3fc', '#22d3ee', '#06b6d4', '#0891b2', '#164e63'],
    Blue: ['#dbeafe', '#bfdbfe', '#60a5fa', '#3b82f6', '#1d4ed8', '#1e3a8a'],
    Purple: ['#ede9fe', '#ddd6fe', '#a78bfa', '#8b5cf6', '#6d28d9', '#4c1d95'],
    Pink: ['#fce7f3', '#fbcfe8', '#f472b6', '#ec4899', '#be185d', '#831843'],
  };
  return (
    <div className="space-y-1">
      {Object.entries(hueSwatches).map(([family, colors]) => (
        <div key={family} className="flex items-center gap-1">
          <span className="w-14 text-[10px] text-slate-500">{family}</span>
          <div className="flex-1 grid grid-cols-6 gap-1">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChange(c)}
                className={`h-5 w-full rounded border ${
                  c.toLowerCase() === value.toLowerCase()
                    ? 'border-blue-500 ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
                style={{ background: c }}
                title={c}
                aria-label={c}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DashField({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string | undefined) => void;
}): JSX.Element {
  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span className="text-slate-500 dark:text-slate-400 w-12">Dash</span>
      <select
        value={value ?? 'solid'}
        onChange={(e) =>
          onChange(e.currentTarget.value === 'solid' ? undefined : e.currentTarget.value)
        }
        className="flex-1 h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
      >
        <option value="solid">Solid</option>
        <option value="4 3">Dashed</option>
        <option value="1 3">Dotted</option>
        <option value="8 4 2 4">Dash-dot</option>
      </select>
    </label>
  );
}

function MetadataEditor({
  value,
  onChange,
}: {
  value: Record<string, string>;
  onChange: (m: Record<string, string>) => void;
}): JSX.Element {
  const entries = Object.entries(value);
  return (
    <div className="space-y-1">
      {entries.length === 0 ? (
        <p className="text-[11px] text-slate-500">
          No metadata — add keys like hostname, IP, vendor, model.
        </p>
      ) : null}
      {entries.map(([k, v], i) => (
        <div key={i} className="flex items-center gap-1">
          <input
            type="text"
            value={k}
            onChange={(e) => {
              const next = { ...value };
              delete next[k];
              next[e.currentTarget.value] = v;
              onChange(next);
            }}
            className="w-1/3 h-6 px-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[10px]"
            placeholder="key"
          />
          <input
            type="text"
            value={v}
            onChange={(e) => onChange({ ...value, [k]: e.currentTarget.value })}
            className="flex-1 h-6 px-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[10px]"
            placeholder="value"
          />
          <button
            type="button"
            onClick={() => {
              const next = { ...value };
              delete next[k];
              onChange(next);
            }}
            className="w-5 h-5 text-slate-400 hover:text-rose-500"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange({ ...value, '': '' })}
        className="h-6 px-2 text-xs rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        + Add field
      </button>
    </div>
  );
}
