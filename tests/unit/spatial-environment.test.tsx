import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SpatialEnvironment from '../../src/components/SpatialEnvironment';

describe('SpatialEnvironment', () => {
  test('renders placeholder and does not throw', () => {
    render(<SpatialEnvironment />);
    expect(screen.getByTestId('spatial-environment')).toBeInTheDocument();
  });
});
