import React from 'react';
import { Modal as DSModal, ModalProps as DSModalProps, ConfirmModal } from '../../design-system/components/Modal';

export interface ModalProps extends DSModalProps {}

export const Modal: React.FC<ModalProps> = (props) => {
  return <DSModal {...props} />;
};

export { ConfirmModal };
export default Modal;
