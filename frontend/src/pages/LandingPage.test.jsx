import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import LandingPage from './LandingPage';

jest.mock('axios');

function renderLandingPage() {
  axios.get.mockResolvedValue({ data: { content: [] } });
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );
}

describe('LandingPage', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders the hero heading', () => {
    renderLandingPage();
    expect(screen.getByRole('heading', { name: /Tech Products You Can Trust/i })).toBeInTheDocument();
  });

  it('renders Shop Now link', () => {
    renderLandingPage();
    expect(screen.getByRole('link', { name: /shop now/i })).toBeInTheDocument();
  });

  it('renders category browse section', () => {
    renderLandingPage();
    expect(screen.getByRole('heading', { name: /shop by category/i })).toBeInTheDocument();
  });

  it('renders Why Choose Us section', () => {
    renderLandingPage();
    expect(screen.getByRole('heading', { name: /why choose us/i })).toBeInTheDocument();
  });

  it('renders register and login links', () => {
    renderLandingPage();
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
  });
});
