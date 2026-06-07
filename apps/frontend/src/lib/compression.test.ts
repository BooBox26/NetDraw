import { describe, it, expect } from 'vitest';
import { repairDiagram } from './compression';

describe('repairDiagram', () => {
  it('should restore a completely empty or invalid object to defaults', () => {
    const { diagram, warnings } = repairDiagram(null);
    expect(diagram.schema).toBe(1);
    expect(diagram.layers.length).toBeGreaterThanOrEqual(1);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('should sanitize shapes with invalid coordinates or sizes', () => {
    const invalidData = {
      schema: 1,
      layers: [
        { id: 'layer-bg', name: 'Background', visible: true, locked: true, opacity: 1, zIndex: 0 },
        {
          id: 'layer-default',
          name: 'Layer 1',
          visible: true,
          locked: false,
          opacity: 1,
          zIndex: 1,
        },
      ],
      shapes: [
        {
          id: 's1',
          type: 'router',
          x: NaN,
          y: -100,
          width: 0,
          height: Infinity,
        },
      ],
      connectors: [],
    };

    const { diagram, warnings } = repairDiagram(invalidData);
    const shape = diagram.shapes[0];
    expect(shape.x).toBe(0);
    expect(shape.y).toBe(-100);
    expect(shape.width).toBe(80);
    expect(shape.height).toBe(80);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('should remove dangling connectors referencing non-existent shapes', () => {
    const dataWithDangling = {
      schema: 1,
      layers: [
        { id: 'layer-bg', name: 'Background', visible: true, locked: true, opacity: 1, zIndex: 0 },
        {
          id: 'layer-default',
          name: 'Layer 1',
          visible: true,
          locked: false,
          opacity: 1,
          zIndex: 1,
        },
      ],
      shapes: [{ id: 's1', type: 'router', x: 10, y: 10, width: 50, height: 50 }],
      connectors: [
        {
          id: 'c1',
          type: 'straight',
          sourceId: 's1',
          targetId: 's2', // s2 does not exist!
          arrows: 'forward',
        },
      ],
    };

    const { diagram, warnings } = repairDiagram(dataWithDangling);
    const conn = diagram.connectors[0];
    expect(conn.sourceId).toBe('s1');
    expect(conn.targetId).toBeNull(); // isolated target reference
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('should clear cyclic parent-child links or missing parent links', () => {
    const cyclicData = {
      schema: 1,
      layers: [
        { id: 'layer-bg', name: 'Background', visible: true, locked: true, opacity: 1, zIndex: 0 },
        {
          id: 'layer-default',
          name: 'Layer 1',
          visible: true,
          locked: false,
          opacity: 1,
          zIndex: 1,
        },
      ],
      shapes: [
        { id: 's1', type: 'group', x: 0, y: 0, width: 100, height: 100, parentId: 's1' }, // cyclic
        { id: 's2', type: 'router', x: 20, y: 20, width: 50, height: 50, parentId: 's_missing' }, // missing
      ],
      connectors: [],
    };

    const { diagram, warnings } = repairDiagram(cyclicData);
    expect(diagram.shapes[0].parentId).toBeNull();
    expect(diagram.shapes[1].parentId).toBeNull();
    expect(warnings.length).toBeGreaterThan(0);
  });
});
