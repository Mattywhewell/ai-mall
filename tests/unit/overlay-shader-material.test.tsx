import React from 'react';
import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';

// mock useFrame to be a no-op so the component can render in jsdom
vi.mock('@react-three/fiber', async () => {
  const actual = await vi.importActual('@react-three/fiber');
  return {
    ...actual,
    useFrame: (fn: any) => {
      // no-op for unit test
      return;
    },
  };
});

import { OverlayShaderMaterial } from '../../../components/visual-layer/ThreeRenderer';

describe('OverlayShaderMaterial', () => {
  let disposeSpy: jest.SpyInstance | any;

  beforeEach(() => {
    disposeSpy = vi.spyOn(THREE.ShaderMaterial.prototype, 'dispose');
  });

  afterEach(() => {
    disposeSpy.mockRestore?.();
  });

  it('disposes the material on unmount', () => {
    const { unmount } = render(<OverlayShaderMaterial strength={0.5} tint="#000" />);
    unmount();
    expect(disposeSpy).toHaveBeenCalled();
  });
});
