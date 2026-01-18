import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';

// Ensure canvas reports a context so hasWebGL becomes true
beforeEach(() => {
  (HTMLCanvasElement.prototype as any).getContext = () => ({});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('VisualLayerRenderer import failure', () => {
  it('loadThreeRenderer rejects when loader throws', async () => {
    const mod = await import('../../components/visual-layer/Renderer');

    // Simulate loader throwing
    vi.spyOn(mod, 'loadThreeRenderer' as any).mockRejectedValue(new Error('import failed'));

    await expect((mod as any).loadThreeRenderer()).rejects.toThrow('import failed');
  });
});
