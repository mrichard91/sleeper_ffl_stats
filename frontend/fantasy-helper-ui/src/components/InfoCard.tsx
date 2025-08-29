import { Card, Typography, Box } from '@mui/joy';
import type { ReactNode } from 'react';

interface InfoCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
}

export default function InfoCard({ title, value, subtitle, icon }: InfoCardProps) {
  return (
    <Card variant="outlined">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon}
        <Typography level="body-sm">{title}</Typography>
      </Box>
      <Typography level="h2" sx={{ mt: 1 }}>{value}</Typography>
      {subtitle && <Typography level="body-xs">{subtitle}</Typography>}
    </Card>
  );
}

