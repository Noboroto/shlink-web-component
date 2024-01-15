import { screen, waitForElementToBeRemoved } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { fromPartial } from '@total-typescript/shoehorn';
import { MemoryRouter } from 'react-router-dom';
import type { Domain } from '../../../src/domains/data';
import { DomainDropdown } from '../../../src/domains/helpers/DomainDropdown';
import { FeaturesProvider } from '../../../src/utils/features';
import { RoutesPrefixProvider } from '../../../src/utils/routesPrefix';
import type { VisitsComparison } from '../../../src/visits/visits-comparison/VisitsComparisonContext';
import { VisitsComparisonProvider } from '../../../src/visits/visits-comparison/VisitsComparisonContext';
import { checkAccessibility } from '../../__helpers__/accessibility';
import { renderWithEvents } from '../../__helpers__/setUpTest';

type SetUpOptions = {
  domain?: Domain;
  withVisits?: boolean;
  visitsComparison?: Partial<VisitsComparison>;
};

describe('<DomainDropdown />', () => {
  const editDomainRedirects = vi.fn().mockResolvedValue(undefined);
  const setUp = ({ domain, withVisits = true, visitsComparison }: SetUpOptions = {}) => renderWithEvents(
    <MemoryRouter>
      <VisitsComparisonProvider
        value={visitsComparison && fromPartial({ canAddItemWithName: () => true, ...visitsComparison })}
      >
        <RoutesPrefixProvider value="/server/123">
          <FeaturesProvider value={fromPartial({ domainVisits: withVisits })}>
            <DomainDropdown
              domain={domain ?? fromPartial({})}
              editDomainRedirects={editDomainRedirects}
            />
          </FeaturesProvider>
        </RoutesPrefixProvider>
      </VisitsComparisonProvider>
    </MemoryRouter>,
  );

  const openMenu = async (user: UserEvent) => {
    // Search by "Options" name, as that's the default aria-label
    await user.click(screen.getByRole('button', { name: 'Options' }));
  };

  it.each([
    [setUp],
    [async () => {
      const { user, container } = setUp({ visitsComparison: { itemsToCompare: [] } });
      await openMenu(user);

      return { container };
    }],
  ])('passes a11y checks', (setUp) => checkAccessibility(setUp()));

  it.each([
    {
      withVisits: false,
      assert: () => {
        expect(screen.queryByText('Visit stats')).not.toBeInTheDocument();
        expect(screen.queryByText('Compare visits')).not.toBeInTheDocument();
        expect(screen.getByText('Edit redirects')).toBeInTheDocument();
      },
    },
    {
      withVisits: true,
      assert: () => {
        expect(screen.getByText('Visit stats')).toBeInTheDocument();
        expect(screen.getByText('Compare visits')).toBeInTheDocument();
        expect(screen.getByText('Edit redirects')).toBeInTheDocument();
      },
    },
  ])('renders expected menu items', ({ withVisits, assert }) => {
    setUp({ withVisits });
    assert();
  });

  it.each([
    [true, '_DEFAULT'],
    [false, ''],
  ])('points first link to the proper section', (isDefault, expectedLink) => {
    setUp({ domain: fromPartial({ domain: 'foo.com', isDefault }) });

    expect(screen.getByText('Visit stats')).toHaveAttribute('href', `/server/123/domain/foo.com${expectedLink}/visits`);
  });

  it.each([
    ['foo.com'],
    ['bar.org'],
    ['baz.net'],
  ])('displays modal when editing redirects', async (domain) => {
    const { user } = setUp({ domain: fromPartial({ domain, isDefault: false }) });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
    await user.click(screen.getByText('Edit redirects'));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    expect(editDomainRedirects).not.toHaveBeenCalled();
    await user.click(screen.getByText('Save'));
    expect(editDomainRedirects).toHaveBeenCalledWith(expect.objectContaining({ domain }));

    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
  });

  it('displays dropdown when clicked', async () => {
    const { user } = setUp();

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await openMenu(user);
    expect(await screen.findByRole('menu')).toBeInTheDocument();
  });

  it.each([
    [undefined],
    [{ itemsToCompare: [{ name: 's.test', query: '' }], canAddItemWithName: () => false }],
  ])('disables compare visits item when it cannot be added', async (visitsComparison) => {
    const { user } = setUp({ visitsComparison, domain: fromPartial({ domain: 's.test' }) });
    await openMenu(user);

    expect(screen.getByRole('button', { name: 'Compare visits' })).toHaveAttribute('disabled');
  });

  it('can add items to compare visits', async () => {
    const addItemToCompare = vi.fn();
    const visitsComparison: Partial<VisitsComparison> = { itemsToCompare: [], addItemToCompare };
    const domain = 's.test';
    const { user } = setUp({ visitsComparison, domain: fromPartial({ domain }) });

    await openMenu(user);
    const item = screen.getByRole('menuitem', { name: 'Compare visits' });

    expect(item).not.toHaveAttribute('disabled');
    await user.click(item);

    expect(addItemToCompare).toHaveBeenCalledWith({ name: domain, query: domain });
  });
});
