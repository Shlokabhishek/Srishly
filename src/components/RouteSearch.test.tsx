import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import RouteSearch from '@/components/RouteSearch';

describe('RouteSearch', () => {
  it('submits a valid route selection', async () => {
    const onSearch = vi.fn().mockResolvedValue(undefined);

    render(<RouteSearch onSearch={onSearch} />);

    fireEvent.change(screen.getByLabelText('From city'), { target: { value: 'Delhi' } });
    fireEvent.change(screen.getByLabelText('To city'), { target: { value: 'Mumbai' } });
    fireEvent.click(screen.getByRole('button', { name: /find route/i }));

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('Delhi', 'Mumbai');
    });
  });

  it('shows validation feedback for incomplete selection', async () => {
    const onSearch = vi.fn();

    render(<RouteSearch onSearch={onSearch} />);

    fireEvent.click(screen.getByRole('button', { name: /find route/i }));

    await waitFor(() => {
      expect(screen.getByText('Choose a supported origin city.')).toBeInTheDocument();
      expect(screen.getByText('Choose a supported destination city.')).toBeInTheDocument();
    });

    expect(onSearch).not.toHaveBeenCalled();
  });
});
