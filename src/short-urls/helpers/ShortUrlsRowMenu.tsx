import {
  faChartPie as pieChartIcon,
  faEdit as editIcon,
  faMinusCircle as deleteIcon,
  faQrcode as qrIcon,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { RowDropdownBtn, useToggle } from '@shlinkio/shlink-frontend-kit';
import type { FC } from 'react';
import { DropdownItem } from 'reactstrap';
import type { ShlinkShortUrl } from '../../api-contract';
import type { FCWithDeps } from '../../container/utils';
import { componentFactory, useDependencies } from '../../container/utils';
import type { ShortUrlModalProps } from '../data';
import { ShortUrlDetailLink } from './ShortUrlDetailLink';

type ShortUrlsRowMenuProps = {
  shortUrl: ShlinkShortUrl;
};

type ShortUrlsRowMenuDeps = {
  DeleteShortUrlModal: ShortUrlModal;
  QrCodeModal: ShortUrlModal;
};

type ShortUrlModal = FC<ShortUrlModalProps>;

const ShortUrlsRowMenu: FCWithDeps<ShortUrlsRowMenuProps, ShortUrlsRowMenuDeps> = ({ shortUrl }) => {
  const { DeleteShortUrlModal, QrCodeModal } = useDependencies(ShortUrlsRowMenu);
  const [isQrModalOpen,, openQrCodeModal, closeQrCodeModal] = useToggle();
  const [isDeleteModalOpen,, openDeleteModal, closeDeleteModal] = useToggle();

  return (
    <RowDropdownBtn minWidth={190}>
      <DropdownItem tag={ShortUrlDetailLink} shortUrl={shortUrl} suffix="visits" asLink>
        <FontAwesomeIcon icon={pieChartIcon} fixedWidth /> Visit stats
      </DropdownItem>

      <DropdownItem tag={ShortUrlDetailLink} shortUrl={shortUrl} suffix="edit" asLink>
        <FontAwesomeIcon icon={editIcon} fixedWidth /> Edit short URL
      </DropdownItem>

      <DropdownItem onClick={openQrCodeModal}>
        <FontAwesomeIcon icon={qrIcon} fixedWidth /> QR code
      </DropdownItem>
      <QrCodeModal shortUrl={shortUrl} isOpen={isQrModalOpen} toggle={closeQrCodeModal} />

      <DropdownItem divider />

      <DropdownItem className="dropdown-item--danger" onClick={openDeleteModal}>
        <FontAwesomeIcon icon={deleteIcon} fixedWidth /> Delete short URL
      </DropdownItem>
      <DeleteShortUrlModal shortUrl={shortUrl} isOpen={isDeleteModalOpen} toggle={closeDeleteModal} />
    </RowDropdownBtn>
  );
};

export type ShortUrlsRowMenuType = typeof ShortUrlsRowMenu;

export const ShortUrlsRowMenuFactory = componentFactory(ShortUrlsRowMenu, ['DeleteShortUrlModal', 'QrCodeModal']);
