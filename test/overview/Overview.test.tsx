import { screen, waitFor } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { MemoryRouter } from 'react-router-dom';
import type { MercureInfo } from '../../src/mercure/reducers/mercureInfo';
import { Overview as overviewCreator } from '../../src/overview/Overview';
import { prettify } from '../../src/utils/helpers/numbers';
import { renderWithEvents } from '../__helpers__/setUpTest';

describe('<Overview />', () => {
  const ShortUrlsTable = () => <>ShortUrlsTable</>;
  const CreateShortUrl = () => <>CreateShortUrl</>;
  const listShortUrls = vi.fn();
  const listTags = vi.fn();
  const loadVisitsOverview = vi.fn();
  const Overview = overviewCreator(ShortUrlsTable, CreateShortUrl);
  const shortUrls = {
    pagination: { totalItems: 83710 },
  };
  const serverId = '123';
  const setUp = (loading = false, excludeBots = false) => renderWithEvents(
    <MemoryRouter>
      <Overview
        listShortUrls={listShortUrls}
        listTags={listTags}
        loadVisitsOverview={loadVisitsOverview}
        shortUrlsList={fromPartial({ loading, shortUrls })}
        tagsList={fromPartial({ loading, tags: ['foo', 'bar', 'baz'] })}
        visitsOverview={fromPartial({
          loading,
          nonOrphanVisits: { total: 3456, bots: 1000, nonBots: 2456 },
          orphanVisits: { total: 28, bots: 15, nonBots: 13 },
        })}
        selectedServer={fromPartial({ id: serverId })}
        createNewVisits={vi.fn()}
        loadMercureInfo={vi.fn()}
        mercureInfo={fromPartial<MercureInfo>({})}
        settings={fromPartial({ visits: { excludeBots } })}
      />
    </MemoryRouter>,
  );

  it('displays loading messages when still loading', () => {
    setUp(true);
    expect(screen.getAllByText('Loading...')).toHaveLength(4);
  });

  it.each([
    [false, 3456, 28],
    [true, 2456, 13],
  ])('displays amounts in cards after finishing loading', (excludeBots, expectedVisits, expectedOrphanVisits) => {
    setUp(false, excludeBots);

    const headingElements = screen.getAllByRole('heading');

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(headingElements[0]).toHaveTextContent('Visits');
    expect(headingElements[1]).toHaveTextContent(prettify(expectedVisits));
    expect(headingElements[2]).toHaveTextContent('Orphan visits');
    expect(headingElements[3]).toHaveTextContent(prettify(expectedOrphanVisits));
    expect(headingElements[4]).toHaveTextContent('Short URLs');
    expect(headingElements[5]).toHaveTextContent(prettify(83710));
    expect(headingElements[6]).toHaveTextContent('Tags');
    expect(headingElements[7]).toHaveTextContent(prettify(3));
  });

  it('nests injected components', () => {
    setUp();

    expect(screen.queryByText('ShortUrlsTable')).toBeInTheDocument();
    expect(screen.queryByText('CreateShortUrl')).toBeInTheDocument();
  });

  it('displays links to other sections', () => {
    setUp();

    const links = screen.getAllByRole('link');

    expect(links).toHaveLength(5);
    expect(links[0]).toHaveAttribute('href', `/server/${serverId}/orphan-visits`);
    expect(links[1]).toHaveAttribute('href', `/server/${serverId}/list-short-urls/1`);
    expect(links[2]).toHaveAttribute('href', `/server/${serverId}/manage-tags`);
    expect(links[3]).toHaveAttribute('href', `/server/${serverId}/create-short-url`);
    expect(links[4]).toHaveAttribute('href', `/server/${serverId}/list-short-urls/1`);
  });

  it.each([
    [true],
    [false],
  ])('displays amounts of bots when hovering visits cards', async (excludeBots) => {
    const { user } = setUp(false, excludeBots);
    const expectTooltipToBeInTheDocument = async (tooltip: string) => waitFor(
      () => expect(screen.getByText(/potential bot visits$/)).toHaveTextContent(tooltip),
    );

    await user.hover(screen.getByText(/^Visits/));
    await expectTooltipToBeInTheDocument(`${excludeBots ? 'Plus' : 'Including'} 1,000 potential bot visits`);

    await user.hover(screen.getByText(/^Orphan visits/));
    await expectTooltipToBeInTheDocument(`${excludeBots ? 'Plus' : 'Including'} 15 potential bot visits`);
  });
});
