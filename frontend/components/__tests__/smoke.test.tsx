// FILE: frontend/components/__tests__/smoke.test.tsx
// Proves jsdom + @testing-library/react + jest-dom matchers are wired.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

function Counter() {
  const [n, setN] = useState(0);
  return (
    <button type="button" onClick={() => setN((v) => v + 1)}>
      count: {n}
    </button>
  );
}

describe('RTL smoke', () => {
  it('renders and reflects state on interaction', async () => {
    render(<Counter />);
    const btn = screen.getByRole('button', { name: /count: 0/i });
    expect(btn).toBeInTheDocument();
    await userEvent.click(btn);
    expect(screen.getByRole('button', { name: /count: 1/i })).toBeInTheDocument();
  });
});
