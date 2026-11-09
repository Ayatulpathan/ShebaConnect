import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App.js';

describe('ShebaConnect Phase 1 — Frontend Base UI Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders default brand name and hero section in Bangla', () => {
    render(<App />);

    const brandTitles = screen.getAllByText('সেবাকানেক্ট');
    expect(brandTitles.length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText('আপনার প্রয়োজনীয় সকল নির্ভরযোগ্য সেবা এখন এক ক্লিকে')
    ).toBeInTheDocument();
  });

  it('toggles language between Bangla and English', () => {
    render(<App />);

    // Toggle button initially shows option to switch to English
    const toggleBtn = screen.getByTitle('Change Language / ভাষা পরিবর্তন');
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveTextContent('English');

    // Click to switch to English
    fireEvent.click(toggleBtn);

    // Verify brand and hero switch to English
    const enBrandTitles = screen.getAllByText('ShebaConnect');
    expect(enBrandTitles.length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText('Reliable Local Home Services at Your Fingertips')
    ).toBeInTheDocument();

    // Verify toggle button now shows option to switch back to বাংলা
    expect(toggleBtn).toHaveTextContent('বাংলা');
  });

  it('renders Dhaka area selector with predefined locations', () => {
    render(<App />);

    const areaSelector = screen.getByRole('combobox');
    expect(areaSelector).toBeInTheDocument();
    expect(screen.getByText('মিরপুর')).toBeInTheDocument();
    expect(screen.getByText('ধানমন্ডি')).toBeInTheDocument();
    expect(screen.getByText('গুলশান')).toBeInTheDocument();
  });
});
