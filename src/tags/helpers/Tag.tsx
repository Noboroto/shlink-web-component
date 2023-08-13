import classNames from 'classnames';
import type { FC, MouseEventHandler, PropsWithChildren } from 'react';
import type { ColorGenerator } from '../../utils/services/ColorGenerator';
import './Tag.scss';

type TagProps = PropsWithChildren<{
  colorGenerator: ColorGenerator;
  text: string;
  className?: string;
  clearable?: boolean;
  onClick?: MouseEventHandler;
  onClose?: MouseEventHandler;
}>;

export const Tag: FC<TagProps> = ({ text, children, clearable, className = '', colorGenerator, onClick, onClose }) => (
  <span
    className={classNames('badge tag', className, { 'tag--light-bg': colorGenerator.isColorLightForKey(text) })}
    style={{ backgroundColor: colorGenerator.getColorForKey(text), cursor: clearable || !onClick ? 'auto' : 'pointer' }}
    onClick={onClick}
  >
    {children ?? text}
    {clearable && (
      <span aria-label={`Remove ${text}`} className="close tag__close-selected-tag" onClick={onClose}>&times;</span>
    )}
  </span>
);
