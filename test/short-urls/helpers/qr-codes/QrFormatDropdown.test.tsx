import { screen } from '@testing-library/react';
import { QrFormatDropdown } from '../../../../src/short-urls/helpers/qr-codes/QrFormatDropdown';
import type { QrCodeFormat } from '../../../../src/utils/helpers/qrCodes';
import { renderWithEvents } from '../../../__helpers__/setUpTest';

describe('<QrFormatDropdown />', () => {
  const initialFormat: QrCodeFormat = 'svg';
  const setFormat = vi.fn();
  const setUp = () => renderWithEvents(<QrFormatDropdown format={initialFormat} setFormat={setFormat} />);

  it('renders initial state', async () => {
    const { user } = setUp();
    const btn = screen.getByRole('button');

    expect(btn).toHaveTextContent('Format (svg');
    await user.click(btn);
    const items = screen.getAllByRole('menuitem');

    expect(items[0]).not.toHaveClass('active');
    expect(items[1]).toHaveClass('active');
  });

  it('invokes callback when items are clicked', async () => {
    const { user } = setUp();
    const clickItem = async (name: string) => {
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('menuitem', { name }));
    };

    expect(setFormat).not.toHaveBeenCalled();

    await clickItem('PNG');
    expect(setFormat).toHaveBeenCalledWith('png');

    await clickItem('SVG');
    expect(setFormat).toHaveBeenCalledWith('svg');
  });
});
