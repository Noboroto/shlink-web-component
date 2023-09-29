import { faInfoCircle as infoIcon } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useToggle } from '@shlinkio/shlink-frontend-kit';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import { UnstyledButton } from '../utils/components/UnstyledButton';
import './UseExistingIfFoundInfoIcon.scss';

const InfoModal = ({ isOpen, toggle }: { isOpen: boolean; toggle: () => void }) => (
  <Modal isOpen={isOpen} toggle={toggle} centered size="lg">
    <ModalHeader toggle={toggle}>Info</ModalHeader>
    <ModalBody>
      <p>
        When the&nbsp;
        <b><i>&quot;Use existing URL if found&quot;</i></b>
        &nbsp;checkbox is checked, the server will return an existing short URL if it matches provided params.
      </p>
      <p>
        These are the checks performed by Shlink in order to determine if an existing short URL should be returned:
      </p>
      <ul>
        <li>
          When only the long URL is provided: The most recent match will be returned, or a new short URL will be created
          if none is found.
        </li>
        <li>
          When long URL and custom slug and/or domain are provided: Same as in previous case, but it will try to match
          the short URL using both the long URL and the slug, the long URL and the domain, or the three of them.
          <br />
          If the slug is being used by another long URL, an error will be returned.
        </li>
        <li>
          When other params are provided: Same as in previous cases, but it will try to match existing short URLs with
          all provided data. If any of them does not match, a new short URL will be created
        </li>
      </ul>
    </ModalBody>
  </Modal>
);

export const UseExistingIfFoundInfoIcon = () => {
  const [isModalOpen, toggleModal] = useToggle();

  // TODO Replace native title with bootstrap tooltip + aria-label for accessibility
  return (
    <>
      <UnstyledButton className="p-0" title="What does this mean?" onClick={toggleModal}>
        <FontAwesomeIcon icon={infoIcon} />
      </UnstyledButton>
      <InfoModal isOpen={isModalOpen} toggle={toggleModal} />
    </>
  );
};
