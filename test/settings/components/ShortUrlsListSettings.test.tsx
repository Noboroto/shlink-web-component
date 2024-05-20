import { screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { ShortUrlsListSettings as ShortUrlsSettings } from '../../../src/settings';
import { SettingsProvider } from '../../../src/settings';
import { ShortUrlsListSettings } from '../../../src/settings/components/ShortUrlsListSettings';
import { checkAccessibility } from '../../__helpers__/accessibility';
import { renderWithEvents } from '../../__helpers__/setUpTest';

describe('<ShortUrlsListSettings />', () => {
  const setSettings = vi.fn();
  const setUp = (shortUrlsList?: ShortUrlsSettings) => renderWithEvents(
    <SettingsProvider value={fromPartial({ shortUrlsList })}>
      <ShortUrlsListSettings
        updateShortUrlsListSettings={setSettings}
        defaultOrdering={{ field: 'dateCreated', dir: 'DESC' }}
      />
    </SettingsProvider>,
  );

  it('passes a11y checks', () => checkAccessibility(setUp()));

  it.each([
    [undefined, 'Order by: Created at - DESC'],
    [fromPartial<ShortUrlsSettings>({}), 'Order by: Created at - DESC'],
    [fromPartial<ShortUrlsSettings>({ defaultOrdering: {} }), 'Order by...'],
    [fromPartial<ShortUrlsSettings>({ defaultOrdering: { field: 'longUrl', dir: 'DESC' } }), 'Order by: Long URL - DESC'],
    [fromPartial<ShortUrlsSettings>({ defaultOrdering: { field: 'visits', dir: 'ASC' } }), 'Order by: Visits - ASC'],
  ])('shows expected ordering', (shortUrlsList, expectedOrder) => {
    setUp(shortUrlsList);
    expect(screen.getByRole('button')).toHaveTextContent(expectedOrder);
  });

  it.each([
    ['Clear selection', undefined, undefined],
    ['Long URL', 'longUrl', 'ASC'],
    ['Visits', 'visits', 'ASC'],
    ['Title', 'title', 'ASC'],
  ])('invokes setSettings when ordering changes', async (name, field, dir) => {
    const { user } = setUp();

    expect(setSettings).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByRole('menuitem', { name }));
    expect(setSettings).toHaveBeenCalledWith({ defaultOrdering: { field, dir } });
  });
});
