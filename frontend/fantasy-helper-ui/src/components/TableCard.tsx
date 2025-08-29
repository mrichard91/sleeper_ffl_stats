import { Sheet, Table, Typography } from '@mui/joy';
import type { ReactNode } from 'react';

interface TableCardProps {
  title: string;
  headers: string[];
  children: ReactNode;
}

export default function TableCard({ title, headers, children }: TableCardProps) {
  return (
    <Sheet variant="outlined" sx={{ borderRadius: 'md', overflow: 'hidden' }}>
      <Typography level="title-md" sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        {title}
      </Typography>
      <Table stickyHeader hoverRow>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </Table>
    </Sheet>
  );
}

