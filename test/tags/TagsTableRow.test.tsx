import { screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { MemoryRouter } from 'react-router-dom';
import type { ModalProps } from 'reactstrap';
import { TagsTableRowFactory } from '../../src/tags/TagsTableRow';
import { RoutesPrefixProvider } from '../../src/utils/routesPrefix';
import { checkAccessibility } from '../__helpers__/accessibility';
import { renderWithEvents } from '../__helpers__/setUpTest';
import { colorGeneratorMock } from '../utils/services/__mocks__/ColorGenerator.mock';

describe('<TagsTableRow />', () => {
  const TagsTableRow = TagsTableRowFactory(fromPartial({
    DeleteTagConfirmModal: ({ isOpen }: ModalProps) => <td>DeleteTagConfirmModal {isOpen ? 'OPEN' : 'CLOSED'}</td>,
    EditTagModal: ({ isOpen }: ModalProps) => <td>EditTagModal {isOpen ? 'OPEN' : 'CLOSED'}</td>,
    ColorGenerator: colorGeneratorMock,
  }));
  const setUp = (tagStats?: { visits?: number; shortUrls?: number }) => renderWithEvents(
    <MemoryRouter>
      <RoutesPrefixProvider value="/server/abc123">
        <table>
          <tbody>
            <TagsTableRow
              tag={{ tag: 'foo&bar', visits: tagStats?.visits ?? 0, shortUrls: tagStats?.shortUrls ?? 0 }}
            />
          </tbody>
        </table>
      </RoutesPrefixProvider>
    </MemoryRouter>,
  );

  it('passes a11y checks', () => checkAccessibility(setUp()));

  it.each([
    [undefined, '0', '0'],
    [{ shortUrls: 10, visits: 3480 }, '10', '3,480'],
  ])('shows expected tag stats', (stats, expectedShortUrls, expectedVisits) => {
    setUp(stats);

    const [shortUrlsLink, visitsLink] = screen.getAllByRole('link');

    expect(shortUrlsLink).toHaveTextContent(expectedShortUrls);
    expect(shortUrlsLink).toHaveAttribute(
      'href',
      `/server/abc123/list-short-urls/1?tags=${encodeURIComponent('foo&bar')}`,
    );
    expect(visitsLink).toHaveTextContent(expectedVisits);
    expect(visitsLink).toHaveAttribute('href', '/server/abc123/tag/foo&bar/visits');
  });

  it('allows toggling dropdown menu', async () => {
    const { user } = setUp();

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button'));
    expect(screen.queryByRole('menu')).toBeInTheDocument();
  });

  it('allows toggling modals through dropdown items', async () => {
    const { user } = setUp();
    const clickItemOnIndex = async (index: 0 | 1) => {
      await user.click(screen.getByRole('button'));
      await user.click(screen.getAllByRole('menuitem')[index]);
    };

    expect(screen.getByText(/^EditTagModal/)).toHaveTextContent('CLOSED');
    expect(screen.getByText(/^EditTagModal/)).not.toHaveTextContent('OPEN');
    await clickItemOnIndex(0);
    expect(screen.getByText(/^EditTagModal/)).toHaveTextContent('OPEN');
    expect(screen.getByText(/^EditTagModal/)).not.toHaveTextContent('CLOSED');

    expect(screen.getByText(/^DeleteTagConfirmModal/)).toHaveTextContent('CLOSED');
    expect(screen.getByText(/^DeleteTagConfirmModal/)).not.toHaveTextContent('OPEN');
    await clickItemOnIndex(1);
    expect(screen.getByText(/^DeleteTagConfirmModal/)).toHaveTextContent('OPEN');
    expect(screen.getByText(/^DeleteTagConfirmModal/)).not.toHaveTextContent('CLOSED');
  });
});
