import { screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { EditTagModal as createEditTagModal } from '../../../src/tags/helpers/EditTagModal';
import type { TagEdition } from '../../../src/tags/reducers/tagEdit';
import { renderWithEvents } from '../../__helpers__/setUpTest';

describe('<EditTagModal />', () => {
  const EditTagModal = createEditTagModal(fromPartial({ getColorForKey: vi.fn(() => 'green') }));
  const editTag = vi.fn().mockReturnValue(Promise.resolve());
  const toggle = vi.fn();
  const setUp = (tagEdit: Partial<TagEdition> = {}) => {
    const edition = fromPartial<TagEdition>(tagEdit);
    return renderWithEvents(
      <EditTagModal isOpen tag="foo" tagEdit={edition} editTag={editTag} tagEdited={vi.fn()} toggle={toggle} />,
    );
  };

  it('allows modal to be toggled with different mechanisms', async () => {
    const { user } = setUp();

    expect(toggle).not.toHaveBeenCalled();

    await user.click(screen.getByLabelText('Close'));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(toggle).toHaveBeenCalledTimes(2);
    expect(editTag).not.toHaveBeenCalled();
  });

  it.each([
    [true, 'Saving...'],
    [false, 'Save'],
  ])('renders submit button in expected state', (editing, name) => {
    setUp({ editing });
    expect(screen.getByRole('button', { name })).toBeInTheDocument();
  });

  it.each([
    [true, 1],
    [false, 0],
  ])('displays error result in case of error', (error, expectedResultCount) => {
    setUp({ error, errorData: fromPartial({}) });
    expect(screen.queryAllByText('Something went wrong while editing the tag :(')).toHaveLength(expectedResultCount);
  });

  it('updates tag value when text changes', async () => {
    const { user } = setUp();
    const getInput = () => screen.getByPlaceholderText('Tag');

    expect(getInput()).toHaveValue('foo');
    await user.clear(getInput());
    await user.type(getInput(), 'bar');
    expect(getInput()).toHaveValue('bar');
  });

  it('invokes all functions on form submit', async () => {
    const { user } = setUp();

    expect(editTag).not.toHaveBeenCalled();
    expect(toggle).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(editTag).toHaveBeenCalled();
    expect(toggle).toHaveBeenCalled();
  });
});
