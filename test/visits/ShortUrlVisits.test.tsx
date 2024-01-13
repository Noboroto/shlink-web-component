import type { ShlinkShortUrl } from '@shlinkio/shlink-js-sdk/api-contract';
import { screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { formatISO } from 'date-fns';
import { MemoryRouter } from 'react-router-dom';
import { now } from 'tinybench';
import type { MercureBoundProps } from '../../src/mercure/helpers/boundToMercureHub';
import { FeaturesProvider } from '../../src/utils/features';
import { SettingsProvider } from '../../src/utils/settings';
import type { ShortUrlVisits as ShortUrlVisitsState } from '../../src/visits/reducers/shortUrlVisits';
import { ShortUrlVisitsFactory } from '../../src/visits/ShortUrlVisits';
import { checkAccessibility } from '../__helpers__/accessibility';
import { renderWithEvents } from '../__helpers__/setUpTest';

describe('<ShortUrlVisits />', () => {
  const getShortUrlVisitsMock = vi.fn();
  const exportVisits = vi.fn();
  const shortUrlVisits = fromPartial<ShortUrlVisitsState>({ visits: [{ date: formatISO(new Date()) }] });
  const ShortUrlVisits = ShortUrlVisitsFactory(fromPartial({
    ReportExporter: fromPartial({ exportVisits }),
  }));
  const setUp = (shortUrlVisitsDeletion = false) => renderWithEvents(
    <MemoryRouter>
      <SettingsProvider value={fromPartial({})}>
        <FeaturesProvider value={fromPartial({ shortUrlVisitsDeletion })}>
          <ShortUrlVisits
            {...fromPartial<MercureBoundProps>({ mercureInfo: {} })}
            getShortUrlsDetails={vi.fn()}
            getShortUrlVisits={getShortUrlVisitsMock}
            shortUrlVisits={shortUrlVisits}
            shortUrlsDetails={fromPartial({
              shortUrls: {
                get: () => fromPartial<ShlinkShortUrl>({
                  shortUrl: 'https://s.test/123',
                  longUrl: 'https://shlink.io',
                  dateCreated: formatISO(now()),
                }),
              },
            })}
            shortUrlVisitsDeletion={fromPartial({})}
            deleteShortUrlVisits={vi.fn()}
            cancelGetShortUrlVisits={vi.fn()}
          />
        </FeaturesProvider>
      </SettingsProvider>
    </MemoryRouter>,
  );

  it('passes a11y checks', () => checkAccessibility(setUp()));

  it('wraps visits stats and header', () => {
    setUp();
    expect(screen.getAllByRole('heading')[0]).toHaveTextContent('Visits for');
    expect(getShortUrlVisitsMock).toHaveBeenCalled();
  });

  it('exports visits when clicking the button', async () => {
    const { user } = setUp();
    const btn = screen.getByRole('button', { name: 'Export (1)' });

    expect(exportVisits).not.toHaveBeenCalled();
    expect(btn).toBeInTheDocument();

    await user.click(btn);
    expect(exportVisits).toHaveBeenCalledWith('short-url_s.test/123_visits.csv', expect.anything());
  });

  it.each([[false], [true]])('renders options menu when the feature is supported', (shortUrlVisitsDeletion) => {
    setUp(shortUrlVisitsDeletion);

    if (shortUrlVisitsDeletion) {
      expect(screen.getByRole('link', { name: 'Options' })).toBeInTheDocument();
    } else {
      expect(screen.queryByRole('link', { name: 'Options' })).not.toBeInTheDocument();
    }
  });
});
