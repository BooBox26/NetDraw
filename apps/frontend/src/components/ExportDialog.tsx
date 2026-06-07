import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { diagramToSvgString, rasterizeSvg } from '../lib/serializer';
import {
  maskSensitiveData,
  generateCsvInventory,
  generateMarkdownDocumentation,
  generateHtmlInteractive,
  generateAuditReport,
} from '../lib/deliverables';
import DOMPurify from 'dompurify';

interface ExportDialogProps {
  format:
    | 'svg'
    | 'png'
    | 'ndj'
    | 'pdf'
    | 'html_interactive'
    | 'markdown'
    | 'csv'
    | 'audit_report'
    | 'project_bundle'
    | string;
  onClose: () => void;
}

const BG_OPTIONS = [
  { id: 'white', label: 'White', value: '#ffffff' },
  { id: 'transparent', label: 'Transparent', value: 'transparent' },
  { id: 'page', label: 'Page color', value: '__page__' },
] as const;

const CLASSIFICATION_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'public', label: 'Public' },
  { id: 'internal', label: 'Internal' },
  { id: 'confidential', label: 'Confidential' },
  { id: 'restricted', label: 'Restricted' },
];

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ExportDialog({ format, onClose }: ExportDialogProps): JSX.Element {
  const diagram = useStore((s) => s.diagram);
  const pushToast = useStore((s) => s.pushToast);

  const [selectedFormat, setSelectedFormat] = useState<string>(format);
  const [scope, setScope] = useState<'page' | 'selection'>('page');

  // PNG options
  const [dpi, setDpi] = useState<1 | 2 | 3 | 4>(2);
  const [pixelWidth, setPixelWidth] = useState<number>(0);
  const [pixelHeight, setPixelHeight] = useState<number>(0);
  const [useExactPixels, setUseExactPixels] = useState(false);
  const [bgChoice, setBgChoice] = useState<(typeof BG_OPTIONS)[number]['id']>('white');
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // New governance & styling options
  const [watermark, setWatermark] = useState('');
  const [classification, setClassification] = useState('none');
  const [showCartouche, setShowCartouche] = useState(false);
  const [clientMasking, setClientMasking] = useState(false);

  // Compute the natural export size
  const naturalSize = useMemo(() => {
    const pad = 16;
    let minX = 0;
    let minY = 0;
    let maxX = diagram.page.width;
    let maxY = diagram.page.height;
    if (diagram.shapes.length > 0) {
      minX = Math.min(...diagram.shapes.map((s) => s.x));
      minY = Math.min(...diagram.shapes.map((s) => s.y));
      maxX = Math.max(...diagram.shapes.map((s) => s.x + s.width));
      maxY = Math.max(...diagram.shapes.map((s) => s.y + s.height));
    }
    return {
      width: Math.max(1, maxX - minX + pad * 2),
      height: Math.max(1, maxY - minY + pad * 2),
    };
  }, [diagram.shapes, diagram.page.width, diagram.page.height]);

  useEffect(() => {
    if (!useExactPixels) {
      setPixelWidth(Math.round(naturalSize.width * dpi));
      setPixelHeight(Math.round(naturalSize.height * dpi));
    }
  }, [dpi, naturalSize.width, naturalSize.height, useExactPixels]);

  // Generate PNG preview
  useEffect(() => {
    if (selectedFormat !== 'png') {
      setPreviewUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const activeDiagram = clientMasking ? maskSensitiveData(diagram) : diagram;
      const svg = diagramToSvgString(activeDiagram, {
        scope,
        background: getBg(),
        watermark: watermark || undefined,
        classification: classification !== 'none' ? classification : undefined,
        showCartouche,
      });
      const cleaned = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
      const blob = await rasterizeSvg(cleaned, 0.5);
      if (cancelled || !blob) return;
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    })();
    return () => {
      cancelled = true;
    };
  }, [
    selectedFormat,
    diagram,
    scope,
    clientMasking,
    watermark,
    classification,
    showCartouche,
    bgChoice,
  ]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const auditIssues = useMemo(() => {
    return generateAuditReport(diagram);
  }, [diagram]);

  async function doExport(): Promise<void> {
    setBusy(true);
    try {
      const activeDiagram = clientMasking ? maskSensitiveData(diagram) : diagram;
      const baseName = `topology-export-${Date.now()}`;

      const svgOpts = {
        scope,
        background: getBg(),
        watermark: watermark || undefined,
        classification: classification !== 'none' ? classification : undefined,
        showCartouche,
      };

      if (selectedFormat === 'svg') {
        const svg = diagramToSvgString(activeDiagram, svgOpts);
        const cleaned = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
        triggerDownload(new Blob([cleaned], { type: 'image/svg+xml' }), `${baseName}.svg`);
        pushToast({ kind: 'success', message: 'SVG vector exported' });
      } else if (selectedFormat === 'png') {
        const svg = diagramToSvgString(activeDiagram, svgOpts);
        const cleaned = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
        const w = useExactPixels
          ? Math.max(1, Math.round(pixelWidth))
          : Math.round(naturalSize.width * dpi);
        const h = useExactPixels
          ? Math.max(1, Math.round(pixelHeight))
          : Math.round(naturalSize.height * dpi);
        const blob = await rasterizeSvg(cleaned, { width: w, height: h, scale: 1 });
        if (!blob) throw new Error('PNG rasterize failed');
        triggerDownload(blob, `${baseName}.png`);
        pushToast({ kind: 'success', message: 'PNG image exported' });
      } else if (selectedFormat === 'pdf') {
        // Download a printable report template embedding the vector SVG diagram
        const svg = diagramToSvgString(activeDiagram, svgOpts);
        const mdText = generateMarkdownDocumentation(activeDiagram, classification, 'approved');
        const printHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Project Report - printable PDF</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
              .header { border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
              .header h1 { margin: 0; font-size: 24px; color: #0f172a; }
              .classification { font-weight: bold; text-transform: uppercase; color: #ef4444; }
              .diagram-container { margin: 30px 0; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; text-align: center; }
              svg { max-width: 100%; height: auto; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
              th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
              th { background: #f1f5f9; }
              @media print {
                body { padding: 0; }
                .diagram-container { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>System Network Topology Report</h1>
              <div class="classification">${classification !== 'none' ? classification : 'INTERNAL'}</div>
            </div>
            <div>
              <p><b>Date:</b> ${new Date().toLocaleDateString()} | <b>Author:</b> Network Architect</p>
            </div>
            <div class="diagram-container">
              ${svg}
            </div>
            <h2>Inventory & Interface Allocations</h2>
            ${mdText.split('## 2. Equipment Index')[1] || ''}
            <script>window.onload = function() { window.print(); }</script>
          </body>
          </html>
        `;
        triggerDownload(new Blob([printHtml], { type: 'text/html' }), `${baseName}-report.html`);
        pushToast({ kind: 'success', message: 'Printable HTML/PDF report generated' });
      } else if (selectedFormat === 'html_interactive') {
        const svg = diagramToSvgString(activeDiagram, svgOpts);
        const htmlPayload = generateHtmlInteractive(activeDiagram, svg);
        triggerDownload(new Blob([htmlPayload], { type: 'text/html' }), `${baseName}-viewer.html`);
        pushToast({ kind: 'success', message: 'Interactive HTML viewer exported' });
      } else if (selectedFormat === 'markdown') {
        const mdText = generateMarkdownDocumentation(activeDiagram, classification, 'draft');
        triggerDownload(new Blob([mdText], { type: 'text/markdown' }), `${baseName}.md`);
        pushToast({ kind: 'success', message: 'Markdown documentation exported' });
      } else if (selectedFormat === 'csv') {
        const csvs = generateCsvInventory(activeDiagram);
        // Download Combined CSV file for simplicity
        const combinedCsv = `### DEVICES INVENTORY ###\n${csvs.devices}\n\n### CONNECTIVITY LINKS ###\n${csvs.links}\n\n### SUBNET IPAM PREFIXES ###\n${csvs.subnets}`;
        triggerDownload(new Blob([combinedCsv], { type: 'text/csv' }), `${baseName}-inventory.csv`);
        pushToast({ kind: 'success', message: 'Combined CSV inventory exported' });
      } else if (selectedFormat === 'audit_report') {
        let textLog = `### NETWORK AUDIT DIAGNOSTIC REPORT ###\nGenerated on: ${new Date().toLocaleString()}\n\n`;
        if (auditIssues.length === 0) {
          textLog += `No anomalies or duplicate configuration errors found! Diagram meets configuration checks.\n`;
        } else {
          auditIssues.forEach((iss) => {
            textLog += `[${iss.severity.toUpperCase()}] (${iss.type}): ${iss.message}\n`;
          });
        }
        triggerDownload(new Blob([textLog], { type: 'text/plain' }), `${baseName}-audit-log.txt`);
        pushToast({ kind: 'success', message: 'Audit report downloaded' });
      } else if (selectedFormat === 'project_bundle') {
        const bundle = {
          schema: 1,
          diagram: activeDiagram,
          metadata: {
            classification,
            watermark,
            exportedAt: Date.now(),
          },
        };
        triggerDownload(
          new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }),
          `${baseName}-bundle.json`
        );
        pushToast({ kind: 'success', message: 'Project bundle packaged' });
      } else if (selectedFormat === 'ndj') {
        const { compressString } = await import('../lib/compression');
        const text = JSON.stringify(activeDiagram);
        const compressedBlob = await compressString(text);
        triggerDownload(compressedBlob, `${baseName}.ndj`);
        pushToast({ kind: 'success', message: 'Compressed NDJ exported' });
      }
      onClose();
    } catch (err) {
      pushToast({ kind: 'error', message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  function getBg(): string {
    if (bgChoice === 'page') return diagram.page.background;
    if (bgChoice === 'transparent') return 'transparent';
    return '#ffffff';
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>📤</span> Deliverables Export Control
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center text-lg"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Inner Content splits parameters and visual preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-5 p-5">
          {/* Options parameters: 5/12 cols */}
          <div className="md:col-span-5 space-y-4 text-sm overflow-y-auto pr-2">
            <Field label="Export Format">
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.currentTarget.value)}
                className="w-full h-9 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-semibold text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-blue-500"
              >
                <option value="svg">Vector Graphic (SVG)</option>
                <option value="png">Rasterised Image (PNG)</option>
                <option value="pdf">Printable HTML/PDF Report</option>
                <option value="html_interactive">Interactive HTML Viewer</option>
                <option value="markdown">Markdown Infrastructure Report</option>
                <option value="csv">CSV Topology Inventory (Combined)</option>
                <option value="ndj">Native Serialised JSON (NDJ)</option>
                <option value="audit_report">Audit Diagnostic Log (Issues)</option>
                <option value="project_bundle">Full Project Package Bundle</option>
              </select>
            </Field>

            <Field label="Diagram Scope">
              <select
                value={scope}
                onChange={(e) => setScope(e.currentTarget.value as 'page' | 'selection')}
                className="w-full h-9 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
              >
                <option value="page">Whole Page Workspace</option>
                <option value="selection">Selected Items Only</option>
              </select>
            </Field>

            {/* Privacy & Governance */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Governance & Security
              </h4>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={clientMasking}
                  onChange={(e) => setClientMasking(e.currentTarget.checked)}
                  className="rounded border-slate-300 focus:ring-blue-500"
                />
                <span>Mask sensitive details (Public IPs, stack serials)</span>
              </label>

              <Field label="Classification Marking">
                <select
                  value={classification}
                  onChange={(e) => setClassification(e.currentTarget.value)}
                  className="w-full h-8 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-350"
                >
                  {CLASSIFICATION_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Overlay Watermark">
                <input
                  type="text"
                  value={watermark}
                  onChange={(e) => setWatermark(e.currentTarget.value)}
                  placeholder="e.g. DRAFT, CONFIDENTIAL"
                  className="w-full h-8 px-2.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
              </Field>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={showCartouche}
                  onChange={(e) => setShowCartouche(e.currentTarget.checked)}
                  className="rounded border-slate-300 focus:ring-blue-500"
                />
                <span>Embed auto titlecartouche block</span>
              </label>
            </div>

            {/* PNG details */}
            {selectedFormat === 'png' && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Image Options
                </h4>
                <Field label="DPI multiplier">
                  <div className="grid grid-cols-4 gap-1">
                    {[1, 2, 3, 4].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setDpi(d as 1 | 2 | 3 | 4);
                          setUseExactPixels(false);
                        }}
                        className={`h-8 rounded border text-xs font-semibold ${
                          dpi === d && !useExactPixels
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {d}×
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Canvas Background">
                  <div className="grid grid-cols-3 gap-1">
                    {BG_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setBgChoice(opt.id)}
                        className={`h-8 rounded border text-xs font-semibold ${
                          bgChoice === opt.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            )}
          </div>

          {/* Live Preview column: 7/12 cols */}
          <div className="md:col-span-7 flex flex-col border-l border-slate-100 dark:border-slate-800 pl-4 h-full">
            <div className="text-xs uppercase tracking-wide text-slate-500 font-bold mb-2">
              Deliverable Output Preview
            </div>

            <div className="flex-1 min-h-[300px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center overflow-auto p-4">
              {selectedFormat === 'png' && previewUrl ? (
                <img
                  src={previewUrl}
                  alt="png preview"
                  className="max-w-full max-h-[340px] shadow border border-slate-200 rounded"
                />
              ) : selectedFormat === 'svg' || selectedFormat === 'pdf' ? (
                <SvgPreview
                  diagram={clientMasking ? maskSensitiveData(diagram) : diagram}
                  scope={scope}
                  background={getBg()}
                  watermark={watermark}
                  classification={classification}
                  showCartouche={showCartouche}
                />
              ) : selectedFormat === 'audit_report' ? (
                <div className="w-full text-xs space-y-2 text-left self-start">
                  <h4 className="font-bold text-slate-700 dark:text-slate-350">
                    Diagnostic Analysis Report ({auditIssues.length} issues)
                  </h4>
                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                    {auditIssues.length === 0 ? (
                      <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                        ✓ Audit succeeded. Zero structural discrepancies found.
                      </div>
                    ) : (
                      auditIssues.map((iss, i) => (
                        <div
                          key={i}
                          className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900"
                        >
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] mr-2 ${
                              iss.severity === 'error'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/30'
                                : iss.severity === 'warning'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950/30'
                            }`}
                          >
                            {iss.severity}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {iss.type}:{' '}
                          </span>
                          <span className="text-slate-650 dark:text-slate-400">{iss.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400 dark:text-slate-500 py-10 space-y-2">
                  <span className="text-4xl">📄</span>
                  <p className="text-xs">
                    Plain text, JSON or Markdown tabular content code will download directly on
                    export.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-2 text-[11px] text-slate-450 dark:text-slate-550 text-center">
              {selectedFormat === 'png' && (
                <>
                  Dimensions:{' '}
                  {useExactPixels
                    ? `${pixelWidth}×${pixelHeight}`
                    : `${Math.round(naturalSize.width * dpi)}×${Math.round(naturalSize.height * dpi)}`}{' '}
                  px
                </>
              )}
              {selectedFormat === 'svg' && <>Scalable Vector Graphics diagram template format</>}
              {selectedFormat === 'pdf' && <>Printable report page (opens browser print options)</>}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 px-5 h-14 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void doExport()}
            disabled={busy}
            className="h-9 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20"
          >
            {busy ? 'Processing…' : 'Download Export'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-bold mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}

function SvgPreview({
  diagram,
  scope,
  background,
  watermark,
  classification,
  showCartouche,
}: {
  diagram: any;
  scope: any;
  background: any;
  watermark: string;
  classification: string;
  showCartouche: boolean;
}): JSX.Element {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const svg = diagramToSvgString(diagram, {
      scope,
      background,
      watermark: watermark || undefined,
      classification: classification !== 'none' ? classification : undefined,
      showCartouche,
    });
    const cleaned = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
    const blob = new Blob([cleaned], { type: 'image/svg+xml' });
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [diagram, scope, background, watermark, classification, showCartouche]);

  if (!url)
    return <p className="text-sm text-slate-500">Compiling diagram vector graphics preview…</p>;
  return <img src={url} alt="svg preview" className="max-w-full max-h-[340px]" />;
}
