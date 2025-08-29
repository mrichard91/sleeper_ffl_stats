import { Typography } from '@mui/joy';
import TableCard from './TableCard';
import StatusBadge from './StatusBadge';

export type TradeTarget = {
  id: string;
  name: string;
  pos: string;
  team: string;
  tier: number;
  fit: number;
  score: number;
};

interface TradeTargetsProps {
  targets: TradeTarget[];
}

export default function TradeTargets({ targets }: TradeTargetsProps) {
  return (
    <TableCard
      title="Trade / Waiver Targets"
      headers={["Name", "Pos", "Team", "Tier", "Fit", "Score"]}
    >
      {targets.map((t) => (
        <tr key={t.id}>
          <td>{t.name}</td>
          <td>{t.pos}</td>
          <td>{t.team}</td>
          <td>{t.tier.toFixed(2)}</td>
          <td>
            {t.fit ? (
              <StatusBadge label="Need" color="warning" />
            ) : (
              <Typography level="body-xs" color="neutral">
                —
              </Typography>
            )}
          </td>
          <td>
            <Typography level="body-sm" fontWeight="md">
              {t.score.toFixed(2)}
            </Typography>
          </td>
        </tr>
      ))}
    </TableCard>
  );
}

