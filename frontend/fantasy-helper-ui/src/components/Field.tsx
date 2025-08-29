import { FormControl, FormLabel } from '@mui/joy';
import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  children: ReactNode;
}

export default function Field({ label, children }: FieldProps) {
  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      {children}
    </FormControl>
  );
}

