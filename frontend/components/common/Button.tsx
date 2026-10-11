import React from 'react';
import { Button as DSButton, ButtonProps as DSButtonProps } from '../../design-system/components/Button';

export interface ButtonProps extends DSButtonProps {}

export const Button: React.FC<ButtonProps> = (props) => {
  return <DSButton {...props} />;
};

export default Button;
