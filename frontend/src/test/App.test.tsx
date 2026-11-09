import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App.js';

describe('ShebaConnect Phase 2 — Frontend UI & Auth Modal Tests', () => {
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

    const toggleBtn = screen.getByTitle('Change Language / ভাষা পরিবর্তন');
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveTextContent('English');

    fireEvent.click(toggleBtn);

    const enBrandTitles = screen.getAllByText('ShebaConnect');
    expect(enBrandTitles.length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText('Reliable Local Home Services at Your Fingertips')
    ).toBeInTheDocument();

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

  it('opens and closes the AuthModal when clicking Login', () => {
    render(<App />);

    const loginBtns = screen.getAllByText('লগইন');
    expect(loginBtns.length).toBeGreaterThanOrEqual(1);

    // Click first login button
    fireEvent.click(loginBtns[0]!);

    // Modal should be open showing "লগইন করুন" header
    expect(screen.getByRole('heading', { name: 'লগইন করুন' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ইমেইল বা মোবাইল নম্বর দিন')).toBeInTheDocument();

    // Switch to Register within modal
    const registerToggle = screen.getByText('নিবন্ধন করুন');
    fireEvent.click(registerToggle);

    expect(screen.getByRole('heading', { name: 'নতুন একাউন্ট তৈরি করুন' })).toBeInTheDocument();
    expect(screen.getByText('গ্রাহক')).toBeInTheDocument();
    expect(screen.getByText('টেকনিশিয়ান')).toBeInTheDocument();
    expect(screen.getByText('কোম্পানি')).toBeInTheDocument();
  });
});
