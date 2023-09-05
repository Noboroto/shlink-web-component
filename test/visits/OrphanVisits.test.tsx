import { screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { formatISO } from 'date-fns';
import { MemoryRouter } from 'react-router-dom';
import type { MercureBoundProps } from '../../src/mercure/helpers/boundToMercureHub';
import { SettingsProvider } from '../../src/utils/settings';
import { OrphanVisitsFactory } from '../../src/visits/OrphanVisits';
import type { VisitsInfo } from '../../src/visits/reducers/types';
import { renderWithEvents } from '../__helpers__/setUpTest';

describe('<OrphanVisits />', () => {
  const getOrphanVisits = vi.fn();
  const exportVisits = vi.fn();
  const orphanVisits = fromPartial<VisitsInfo>({ visits: [{ date: formatISO(new Date()) }] });
  const OrphanVisits = OrphanVisitsFactory(fromPartial({
    ReportExporter: fromPartial({ exportVisits }),
  }));
  const setUp = () => renderWithEvents(
    <MemoryRouter>
      <SettingsProvider value={fromPartial({})}>
        <OrphanVisits
          {...fromPartial<MercureBoundProps>({ mercureInfo: {} })}
          getOrphanVisits={getOrphanVisits}
          orphanVisits={orphanVisits}
          cancelGetOrphanVisits={vi.fn()}
        />
      </SettingsProvider>
    </MemoryRouter>,
  );

  it('wraps visits stats and header', () => {
    setUp();
    expect(screen.getByRole('heading', { name: 'Orphan visits' })).toBeInTheDocument();
    expect(getOrphanVisits).toHaveBeenCalled();
  });

  it('exports visits when clicking the button', async () => {
    const { user } = setUp();
    const btn = screen.getByRole('button', { name: 'Export (1)' });

    expect(exportVisits).not.toHaveBeenCalled();
    expect(btn).toBeInTheDocument();

    await user.click(btn);
    expect(exportVisits).toHaveBeenCalledWith('orphan_visits.csv', expect.anything());
  });
});
