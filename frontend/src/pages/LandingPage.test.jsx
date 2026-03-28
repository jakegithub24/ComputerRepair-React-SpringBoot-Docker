import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from './LandingPage';

function renderLandingPage() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );
}

describe('LandingPage', () => {
  it('renders the shop name', () => {
    renderLandingPage();
    expect(screen.getByRole('heading', { name: /TechFix Repair Shop/i })).toBeInTheDocument();
  });

  it('renders contact information', () => {
    renderLandingPage();
    expect(screen.getByText(/contact@techfixrepair\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/\+44 1234 567890/i)).toBeInTheDocument();
  });

  it('renders all 5 service types', () => {
    renderLandingPage();
    const serviceNames = ['Buy', 'Sell', 'Upgrade', 'Repair', 'General Enquiry'];
    serviceNames.forEach((name) => {
      // Each service name appears as a <strong> heading inside a list item
      const matches = screen.getAllByText(new RegExp(name, 'i'));
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  it('renders register and login links', () => {
    renderLandingPage();
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
  });
});
