'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { Button, ButtonProps } from './button';

export function SubmitButton({ children, isLoading, ...props }: ButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" isLoading={pending || isLoading} {...props}>
      {children}
    </Button>
  );
}
