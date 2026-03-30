import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext';

// matchMedia is mocked in setup.ts — returns matches: false → 'light' default

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset document class list so tests are independent
    document.documentElement.classList.remove('dark');
  });

  describe('default theme', () => {
    it('defaults to light when matchMedia returns false and no stored value', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });
      expect(result.current.theme).toBe('light');
    });

    it('reads stored theme from localStorage on mount', () => {
      localStorage.setItem('gtp-theme', 'dark');
      const { result } = renderHook(() => useTheme(), { wrapper });
      expect(result.current.theme).toBe('dark');
    });

    it('ignores an invalid stored value and uses matchMedia fallback', () => {
      localStorage.setItem('gtp-theme', 'invalid-value');
      const { result } = renderHook(() => useTheme(), { wrapper });
      // matchMedia mock returns false → light
      expect(result.current.theme).toBe('light');
    });
  });

  describe('toggleTheme', () => {
    it('switches from light to dark', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });
      expect(result.current.theme).toBe('light');

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('dark');
    });

    it('switches from dark back to light', () => {
      localStorage.setItem('gtp-theme', 'dark');
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');
    });

    it('toggles back and forth correctly', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => { result.current.toggleTheme(); });
      expect(result.current.theme).toBe('dark');

      act(() => { result.current.toggleTheme(); });
      expect(result.current.theme).toBe('light');
    });
  });

  describe('localStorage persistence', () => {
    it('persists the theme to localStorage after toggle', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.toggleTheme();
      });

      expect(localStorage.getItem('gtp-theme')).toBe('dark');
    });

    it('persists light theme to localStorage', () => {
      localStorage.setItem('gtp-theme', 'dark');
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.toggleTheme();
      });

      expect(localStorage.getItem('gtp-theme')).toBe('light');
    });
  });

  describe('document class manipulation', () => {
    it('adds dark class to documentElement when theme is dark', () => {
      localStorage.setItem('gtp-theme', 'dark');
      renderHook(() => useTheme(), { wrapper });
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes dark class from documentElement when theme is light', () => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('gtp-theme', 'light');
      renderHook(() => useTheme(), { wrapper });
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('adds dark class after toggling to dark', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.toggleTheme();
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('useTheme error guard', () => {
    it('throws when used outside ThemeProvider', () => {
      // Suppress the expected React error output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderHook(() => useTheme())).toThrow(
        'useTheme must be used within ThemeProvider'
      );
      consoleSpy.mockRestore();
    });
  });
});
