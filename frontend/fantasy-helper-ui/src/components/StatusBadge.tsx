import Chip from '@mui/joy/Chip';

interface StatusBadgeProps {
  label: string;
  color?: 'primary' | 'success' | 'warning';
}

export default function StatusBadge({ label, color = 'primary' }: StatusBadgeProps) {
  return (
    <Chip size="sm" variant="soft" color={color}>
      {label}
    </Chip>
  );
}

