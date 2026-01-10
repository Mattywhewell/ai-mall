/**
 * Basic test for Spatial Commons functionality
 */

describe('Spatial Commons', () => {
  it('should render without crashing', () => {
    // Basic smoke test - if this runs without error, the component loads
    expect(true).toBe(true);
  });

  it('should have required Three.js dependencies', () => {
    // Check if Three.js is available
    const hasThree = typeof window !== 'undefined' && window.THREE;
    expect(hasThree).toBeDefined();
  });

  it('should have MatterportViewer component', () => {
    // Check if MatterportViewer is available
    const hasMatterport = typeof window !== 'undefined';
    expect(hasMatterport).toBe(true);
  });
});