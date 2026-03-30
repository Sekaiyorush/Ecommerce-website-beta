import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ErrorBoundary } from '../ErrorBoundary';

// Silence the expected React error boundary console.error output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

// Component that throws on render so we can trigger the error boundary
function BombComponent(): never {
  throw new Error('Test explosion');
}

function GoodComponent() {
  return <p>All good</p>;
}

describe('ErrorBoundary', () => {
  it('renders children normally when there is no error', () => {
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <GoodComponent />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('shows the default error UI when a child throws', () => {
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <BombComponent />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    // Default fallback renders "Golden Tier" brand text
    expect(screen.getByText('Golden Tier')).toBeInTheDocument();
    expect(screen.getByText('Premium Research Compounds')).toBeInTheDocument();
  });

  it('renders the custom fallback prop instead of default UI when provided', () => {
    const CustomFallback = <div>Custom error screen</div>;
    render(
      <MemoryRouter>
        <ErrorBoundary fallback={CustomFallback}>
          <BombComponent />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(screen.getByText('Custom error screen')).toBeInTheDocument();
    expect(screen.queryByText('Golden Tier')).toBeNull();
  });

  it('does not show error UI when children render successfully', () => {
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <GoodComponent />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(screen.queryByText('Golden Tier')).toBeNull();
    expect(screen.queryByText('Premium Research Compounds')).toBeNull();
  });
});
