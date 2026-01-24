import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
// Mock out `three` for JSDOM so the component's dynamic import does not attempt WebGL
vi.mock('three', () => ({
  Scene: function Scene() {},
  PerspectiveCamera: function PerspectiveCamera() { return { position: { set: () => {} }, updateProjectionMatrix: () => {} }; },
  WebGLRenderer: function WebGLRenderer() { return { setSize: () => {}, setPixelRatio: () => {}, domElement: document.createElement('canvas'), dispose: () => {} }; },
  Color: function Color() {},
  FogExp2: function FogExp2() {},
  AmbientLight: function AmbientLight() {},
  DirectionalLight: function DirectionalLight() {},
  BoxGeometry: function BoxGeometry() {},
  MeshLambertMaterial: function MeshLambertMaterial() {},
  Mesh: function Mesh() {},
  Group: function Group() {},
}));

import { render, screen, waitFor } from '@testing-library/react';
import SpatialEnvironment from '../../src/components/SpatialEnvironment';

describe('SpatialEnvironment', () => {
  test('renders placeholder and does not throw', async () => {
    const { container } = render(<SpatialEnvironment />);
    // Ensure the component rendered (we don't need to assert the three renderer details in unit tests)
    await waitFor(() => expect(container.firstChild).toBeTruthy());
    expect(container.firstChild).toBeTruthy();
  });
});
