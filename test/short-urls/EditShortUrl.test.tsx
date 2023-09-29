import { render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { MemoryRouter } from 'react-router-dom';
import { EditShortUrlFactory } from '../../src/short-urls/EditShortUrl';
import type { ShortUrlDetail } from '../../src/short-urls/reducers/shortUrlDetail';
import type { ShortUrlEdition } from '../../src/short-urls/reducers/shortUrlEdition';
import { SettingsProvider } from '../../src/utils/settings';
import { checkAccessibility } from '../__helpers__/accessibility';

describe('<EditShortUrl />', () => {
  const shortUrlCreation = { validateUrls: true };
  const EditShortUrl = EditShortUrlFactory(fromPartial({ ShortUrlForm: () => <span>ShortUrlForm</span> }));
  const setUp = (detail: Partial<ShortUrlDetail> = {}, edition: Partial<ShortUrlEdition> = {}) => render(
    <MemoryRouter>
      <SettingsProvider value={fromPartial({ shortUrlCreation })}>
        <EditShortUrl
          shortUrlDetail={fromPartial(detail)}
          shortUrlEdition={fromPartial(edition)}
          getShortUrlDetail={vi.fn()}
          editShortUrl={vi.fn(async () => Promise.resolve())}
        />
      </SettingsProvider>
    </MemoryRouter>,
  );

  it.each([
    [{ loading: true }, {}],
    [{ error: true }, {}],
    [{}, {}],
    [{}, { error: true, saved: true }],
    [{}, { error: false, saved: true }],
  ])('passes a11y checks', (detail, edition) => checkAccessibility(setUp(
    {
      shortUrl: fromPartial({
        shortUrl: 'https://s.test/abc123',
        meta: {},
      }),
      ...detail,
    },
    edition,
  )));

  it('renders loading message while loading detail', () => {
    setUp({ loading: true });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('ShortUrlForm')).not.toBeInTheDocument();
  });

  it('renders error when loading detail fails', () => {
    setUp({ error: true });

    expect(screen.getByText('An error occurred while loading short URL detail :(')).toBeInTheDocument();
    expect(screen.queryByText('ShortUrlForm')).not.toBeInTheDocument();
  });

  it('renders form when detail properly loads', () => {
    setUp({ shortUrl: fromPartial({ meta: {} }) });

    expect(screen.getByText('ShortUrlForm')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.queryByText('An error occurred while loading short URL detail :(')).not.toBeInTheDocument();
  });

  it('shows error when saving data has failed', () => {
    setUp({}, { error: true, saved: true });

    expect(screen.getByText('An error occurred while updating short URL :(')).toBeInTheDocument();
    expect(screen.getByText('ShortUrlForm')).toBeInTheDocument();
  });

  it('shows message when saving data succeeds', () => {
    setUp({}, { error: false, saved: true });

    expect(screen.getByText('Short URL properly edited.')).toBeInTheDocument();
    expect(screen.getByText('ShortUrlForm')).toBeInTheDocument();
  });
});
