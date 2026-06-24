import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeroSection } from '../hero-section';

describe('HeroSection', () => {
  it('renders the heading', () => {
    render(<HeroSection />);
    expect(screen.queryByText(/confirmed commitments/i)).toBeTruthy();
  });

  it('renders both CTA buttons', () => {
    render(<HeroSection />);
    expect(screen.queryByText('Start Free Trial')).toBeTruthy();
    expect(screen.queryByText('Access Dashboard')).toBeTruthy();
  });

  it('links to /register and /login', () => {
    render(<HeroSection />);
    const registerLink = screen.getByText('Start Free Trial').closest('a');
    const loginLink = screen.getByText('Access Dashboard').closest('a');
    expect(registerLink?.getAttribute('href')).toBe('/register');
    expect(loginLink?.getAttribute('href')).toBe('/login');
  });

  it('buttons have full-width class on mobile', () => {
    render(<HeroSection />);
    const buttons = screen.getAllByRole('link');
    buttons.forEach((btn) => {
      expect(btn.className).toContain('sm:w-auto');
    });
  });
});
