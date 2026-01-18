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
  it('falls back to static preview and reports telemetry when loader throws', async () => {
    const mod = await import('../../../components/visual-layer/Renderer');

    // Mock loadThreeRenderer to throw, simulating dynamic import failure
    vi.spyOn(mod, 'loadThreeRenderer').mockRejectedValue(new Error('import failed'));

    // Spy on telemetry helper
    const telemetry = await import('../../../lib/telemetry/reportRendererImportFailure');
    const spy = vi.spyOn(telemetry, 'reportRendererImportFailure').mockResolvedValue(undefined as any);

    // Now import the component and render
    const { default: VisualLayerRenderer } = await import('../../../components/visual-layer/Renderer');

    render(<VisualLayerRenderer />);

    // Expect the fallback image to appear
    await waitFor(() => expect(screen.getByAltText('Runic glow preview')).toBeInTheDocument());

    // Telemetry should be reported
    await waitFor(() => expect(spy).toHaveBeenCalled());
  });
});
