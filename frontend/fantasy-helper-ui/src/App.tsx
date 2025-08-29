import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  Users,
  Trophy,
  Shield,
  LineChart as LineIcon,
  RefreshCw,
  Search,
  CloudOff,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  Bar,
} from "recharts";
import {
  Box,
  Button,
  Card,
  Grid,
  Input,
  Sheet,
  Typography,
  Tabs,
  TabList,
  Tab,
  TabPanel,
} from "@mui/joy";
import Stack from "@mui/joy/Stack";
import Chip from "@mui/joy/Chip";
import Tooltip from "@mui/joy/Tooltip";
import Field from "./components/Field";
import InfoCard from "./components/InfoCard";
import StatusBadge from "./components/StatusBadge";
import TableCard from "./components/TableCard";

/**
 * Fantasy Helper — React Frontend (Sleeper)
 * Visual refresh: tidy typography, consistent spacing, compact header, sticky tables,
 * subtle shadows, improved contrast, responsive layout.
 */

// ===== Config =====
const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || "/api";

// ===== Types =====
export type PlayerMeta = {
  player_id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  position?: string;
  team?: string;
  age?: number;
  injury_status?: string;
  bye_week?: number;
};

export type League = {
  league_id: string;
  name?: string;
  season?: string;
  total_rosters?: number;
  settings?: any;
};

export type Roster = {
  roster_id: number;
  owner_id?: string;
  players: string[];
  starters: string[];
};

export type User = { user_id: string; display_name?: string };
export type TrendingItem = { player_id: string; count: number };

// ===== Helpers =====
async function safeJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

function useLocalStorage<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const v = localStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [key, state]);
  return [state, setState] as const;
}

// Mock Data (small)
const MOCK = {
  user: { user_id: "909884759852089344", username: "matt" },
  leagues: [
    { league_id: "1227422684355244032", name: "Dynasty Sharks", season: "2025", total_rosters: 10 },
  ],
  users: [
    { user_id: "909884759852089344", display_name: "Matt" },
    { user_id: "974706796101152768", display_name: "Chris" },
  ],
  rosters: [
    { roster_id: 1, owner_id: "909884759852089344", players: ["4984","9221","8151","6786","7090","12514","7553","5967","8210"], starters: ["4984","9221","8151","6786","7090","12514"] },
    { roster_id: 2, owner_id: "974706796101152768", players: ["4234","5854","7021","7587","7670","11565"], starters: ["4234","5854","7021","7587"] },
  ],
  players: {
    "4984": { player_id: "4984", full_name: "Patrick Mahomes", position: "QB", team: "KC", age: 29, bye_week: 10 },
    "9221": { player_id: "9221", full_name: "Justin Jefferson", position: "WR", team: "MIN", age: 26, bye_week: 13 },
    "8151": { player_id: "8151", full_name: "Amon-Ra St. Brown", position: "WR", team: "DET", age: 25, bye_week: 5 },
    "6786": { player_id: "6786", full_name: "Bijan Robinson", position: "RB", team: "ATL", age: 23, bye_week: 12 },
    "7090": { player_id: "7090", full_name: "Breece Hall", position: "RB", team: "NYJ", age: 24, bye_week: 7 },
    "12514": { player_id: "12514", full_name: "Sam LaPorta", position: "TE", team: "DET", age: 24, bye_week: 5 },
    "7553": { player_id: "7553", full_name: "De'Von Achane", position: "RB", team: "MIA", age: 23, bye_week: 6 },
    "5967": { player_id: "5967", full_name: "Mike Evans", position: "WR", team: "TB", age: 31, bye_week: 11 },
    "8210": { player_id: "8210", full_name: "Rashee Rice", position: "WR", team: "KC", age: 24, bye_week: 10 },
    "4234": { player_id: "4234", full_name: "Josh Allen", position: "QB", team: "BUF", age: 29, bye_week: 12 },
    "5854": { player_id: "5854", full_name: "Saquon Barkley", position: "RB", team: "PHI", age: 28, bye_week: 5 },
    "7021": { player_id: "7021", full_name: "CeeDee Lamb", position: "WR", team: "DAL", age: 26, bye_week: 7 },
    "7587": { player_id: "7587", full_name: "Jaylen Waddle", position: "WR", team: "MIA", age: 26, bye_week: 6 },
    "7670": { player_id: "7670", full_name: "Tee Higgins", position: "WR", team: "CIN", age: 26, bye_week: 12 },
    "11565": { player_id: "11565", full_name: "Dalton Kincaid", position: "TE", team: "BUF", age: 25, bye_week: 12 },
  } as Record<string, PlayerMeta>,
  trendingAdd: [
    { player_id: "7670", count: 10234 },
    { player_id: "5854", count: 8123 },
    { player_id: "8210", count: 7777 },
    { player_id: "7553", count: 6888 },
    { player_id: "11565", count: 5120 },
  ] as TrendingItem[],
};

function useProxyAvailable() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/health`, { signal: ctrl.signal });
        setOk(r.ok);
      } catch {
        setOk(false);
      }
    })();
    return () => ctrl.abort();
  }, []);
  return ok; // null=loading
}

// Tier heuristic combining rostered %, starting %, and trending on a 1-5 scale (1=best, 5=worst)
function computeTierScore(
  playerId: string,
  rosters: Roster[] | null,
  trending: TrendingItem[] | null
): number {
  const total = rosters?.length ?? 0;
  let rostered = 0;
  let started = 0;
  if (total > 0 && rosters) {
    rosters.forEach((r) => {
      if (r.players.includes(playerId)) {
        rostered++;
        if (r.starters.includes(playerId)) started++;
      }
    });
  }
  const rosteredPct = total > 0 ? rostered / total : 0;
  const startingPct = total > 0 ? started / total : 0;
  const trendCount = trending?.find((x) => x.player_id === playerId)?.count ?? 0;
  const trendScore = trendCount > 0 ? Math.min(1, Math.log10(1 + trendCount) / 5) : 0;
  const score = 0.6 * startingPct + 0.3 * rosteredPct + 0.1 * trendScore;
  if (score >= 0.8) return 1;
  if (score >= 0.6) return 2;
  if (score >= 0.4) return 3;
  if (score >= 0.2) return 4;
  return 5;
}
const positionOf = (p?: PlayerMeta) => p?.position || "";
const nameOf = (p?: PlayerMeta) => p?.full_name || `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim();

export default function App() {
  const [username, setUsername] = useLocalStorage("fh.username", "mrichard91");
  const [season, setSeason] = useLocalStorage("fh.season", new Date().getFullYear().toString());
  const [leagueId, setLeagueId] = useLocalStorage<string | null>("fh.leagueId", null);
  const [leagues, setLeagues] = useState<League[] | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [rosters, setRosters] = useState<Roster[] | null>(null);
  const [players, setPlayers] = useState<Record<string, PlayerMeta> | null>(null);
  const [trendingAdd, setTrendingAdd] = useState<TrendingItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const proxyOk = useProxyAvailable();
  const mockMode = proxyOk === false;
  const [view, setView] = useState<"team" | "all">("team");
  const [selectedRosterId, setSelectedRosterId] = useState<number | undefined>(undefined);
  const [sortByPos, setSortByPos] = useState(false);

  async function loadLeagues() {
    setLoading(true);
    try {
      if (mockMode) {
        setLeagues(MOCK.leagues as any);
        setUsers(MOCK.users as any);
      } else {
        const user = await safeJSON<{ user_id: string }>(`${API_BASE}/user/${encodeURIComponent(username as string)}`);
        const leagues = await safeJSON<League[]>(`${API_BASE}/user/${user.user_id}/leagues/${season}`);
        setLeagues(leagues);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadLeague(league_id: string) {
    setLoading(true);
    try {
      setLeagueId(league_id);
      if (mockMode) {
        setUsers(MOCK.users as any);
        setRosters(MOCK.rosters as any);
        setPlayers(MOCK.players);
        setTrendingAdd(MOCK.trendingAdd);
      } else {
        const [users, rosters, players, trending] = await Promise.all([
          safeJSON<User[]>(`${API_BASE}/league/${league_id}/users`),
          safeJSON<Roster[]>(`${API_BASE}/league/${league_id}/rosters`),
          safeJSON<Record<string, PlayerMeta>>(`${API_BASE}/players`),
          safeJSON<TrendingItem[]>(`${API_BASE}/players/trending/add?limit=50&lookback_hours=168`),
        ]);
        setUsers(users);
        setRosters(rosters);
        setPlayers(players);
        setTrendingAdd(trending);
      }
    } finally {
      setLoading(false);
    }
  }

  const myRoster: Roster | undefined = useMemo(() => {
    if (!rosters || !users) return undefined;
    const u = users.find((u) => (u.display_name || "").toLowerCase().includes((username as string).toLowerCase()));
    if (!u) return rosters[0];
    return rosters.find((r) => r.owner_id === u.user_id) || rosters[0];
  }, [rosters, users, username]);
  useEffect(() => {
    if (myRoster) setSelectedRosterId(myRoster.roster_id);
  }, [myRoster]);

  const roster: Roster | undefined = useMemo(() => {
    if (!rosters) return undefined;
    return rosters.find((r) => r.roster_id === selectedRosterId) || myRoster;
  }, [rosters, selectedRosterId, myRoster]);

  const startersSet = useMemo(() => new Set(roster?.starters || []), [roster]);

  const rosterRows = useMemo(() => {
    if (!roster || !players) return [] as any[];
    const trend = trendingAdd || [];
    const rows = roster.players.map((pid) => {
      const p = players[pid];
      const tier = computeTierScore(pid, rosters, trend);
      const starter = startersSet.has(pid);
      return {
        id: pid,
        name: nameOf(p),
        pos: positionOf(p),
        team: p?.team || "",
        age: p?.age ?? 0,
        bye: p?.bye_week ?? "—",
        injury: p?.injury_status || "",
        tier,
        starter,
      };
    });
    if (sortByPos) {
      return rows.sort((a, b) => {
        const posComp = a.pos.localeCompare(b.pos);
        if (posComp !== 0) return posComp;
        return a.starter === b.starter ? a.tier - b.tier : a.starter ? -1 : 1;
      });
    }
    return rows.sort((a, b) => (a.starter === b.starter ? a.tier - b.tier : a.starter ? -1 : 1));
  }, [roster, players, rosters, trendingAdd, startersSet, sortByPos]);

  const posCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rosterRows) counts[r.pos] = (counts[r.pos] || 0) + 1;
    return Object.entries(counts).map(([pos, count]) => ({ pos, count }));
  }, [rosterRows]);

  const needs = useMemo(() => {
    const need: string[] = [];
    const counts = new Map<string, number>();
    for (const r of rosterRows) counts.set(r.pos, (counts.get(r.pos) || 0) + 1);
    ["RB", "WR", "QB", "TE"].forEach((pos) => {
      const c = counts.get(pos) || 0;
      if ((pos === "RB" || pos === "WR") && c < 4) need.push(pos);
      if ((pos === "QB" || pos === "TE") && c < 2) need.push(pos);
    });
    return need;
  }, [rosterRows]);

  const targets = useMemo(() => {
    if (!players || !rosterRows.length || !trendingAdd) return [] as any[];
    const mine = new Set((roster?.players || []));
    const cands = trendingAdd
      .map((t) => players[t.player_id])
      .filter(Boolean)
      .filter((p) => !mine.has(p!.player_id));
    return cands
      .map((p) => {
        const tier = computeTierScore(p!.player_id, rosters, trendingAdd);
        const fit = needs.includes(positionOf(p)) ? 1 : 0;
        return {
          id: p!.player_id,
          name: nameOf(p),
          pos: positionOf(p),
          team: p?.team || "",
          tier,
          fit,
          score: (5 - tier) + 0.3 * fit,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 25);
  }, [players, roster, rosters, trendingAdd, needs, rosterRows.length]);

  const teamRatings = useMemo(() => {
    if (!rosters || !players) return [] as any[];
    const trend = trendingAdd || [];
    return rosters.map((r) => {
      const tiersByPos: Record<string, number[]> = {};
      r.players.forEach((pid) => {
        const p = players[pid];
        if (!p) return;
        const pos = positionOf(p);
        const tier = computeTierScore(pid, rosters, trend);
        (tiersByPos[pos] ||= []).push(tier);
      });
      const allTiers: number[] = [];
      Object.values(tiersByPos).forEach((arr) => allTiers.push(...arr));
      const rating = allTiers.length ? allTiers.reduce((a, b) => a + b, 0) / allTiers.length : 0;
      const posAvgs = Object.entries(tiersByPos).map(([pos, arr]) => ({
        pos,
        avg: arr.reduce((a, b) => a + b, 0) / arr.length,
        count: arr.length,
      }));
      const top = posAvgs.reduce(
        (min, cur) => (cur.avg < min.avg ? cur : min),
        { pos: "—", avg: Infinity, count: 0 }
      );
      const bottom = posAvgs.reduce(
        (max, cur) => (cur.avg > max.avg ? cur : max),
        { pos: "—", avg: -Infinity, count: 0 }
      );
      const strength =
        top.pos === "—"
          ? "—"
          : `${top.pos} (avg ${top.avg.toFixed(2)} across ${top.count} players)`;
      const weakness =
        bottom.pos === "—"
          ? "—"
          : `${bottom.pos} (avg ${bottom.avg.toFixed(2)} across ${bottom.count} players)`;
      const owner = users?.find((u) => u.user_id === r.owner_id)?.display_name || `Roster ${r.roster_id}`;
      return { rosterId: r.roster_id, owner, rating, strength, weakness };
    }).sort((a, b) => a.rating - b.rating);
  }, [rosters, players, trendingAdd, users]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.body" }}>
      <Sheet
        variant="outlined"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            maxWidth: "1024px",
            mx: "auto",
            p: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Shield size={20} />
            <Typography level="title-md">Fantasy Helper</Typography>
          </Box>
          <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
            {proxyOk === false && (
              <Chip size="sm" color="warning" variant="soft" startDecorator={<CloudOff size={16} />}>
                Mock Mode
              </Chip>
            )}
            <Button
              variant="outlined"
              size="sm"
              startDecorator={<RefreshCw size={16} />}
              onClick={() => window.location.reload()}
            >
              Reload
            </Button>
          </Box>
        </Box>
      </Sheet>

      <Box sx={{ maxWidth: "1024px", mx: "auto", p: 2 }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid xs={12} md={4}>
            <Field label="Username">
              <Input
                value={username as string}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Sleeper username"
              />
            </Field>
          </Grid>
          <Grid xs={12} md={4}>
            <Field label="Season">
              <Input
                value={season as string}
                onChange={(e) => setSeason(e.target.value)}
                placeholder="2025"
              />
            </Field>
          </Grid>
          <Grid xs={12} md={4} sx={{ display: "flex", alignItems: "flex-end" }}>
            <Button
              onClick={loadLeagues}
              disabled={loading}
              startDecorator={<Search size={16} />}
              fullWidth
            >
              Load Leagues
            </Button>
          </Grid>
          <Grid xs={12}>
            <Typography level="body-xs">
              API: {proxyOk === null ? "…" : proxyOk ? "connected" : "offline"}
            </Typography>
          </Grid>
        </Grid>

        {leagues && leagues.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography level="title-lg" sx={{ mb: 1 }}>
              Leagues
            </Typography>
            <Grid container spacing={2}>
              {leagues.map((lg) => (
                <Grid xs={12} md={4} key={lg.league_id}>
                  <Card
                    variant={leagueId === lg.league_id ? "solid" : "outlined"}
                    onClick={() => loadLeague(lg.league_id)}
                    sx={{ cursor: "pointer" }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography level="body-md" noWrap sx={{ mr: 1 }}>
                        {lg.name || lg.league_id}
                      </Typography>
                      <Trophy size={16} />
                    </Box>
                    <Typography level="body-sm">
                      Season {lg.season} · {lg.total_rosters ?? "?"} teams
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {leagueId && (
          <Tabs value={view} onChange={(_, v) => setView(v as "team" | "all")} sx={{ mb: 2 }}>
            <TabList>
              <Tab value="team">Team Detail</Tab>
              <Tab value="all">All Teams</Tab>
            </TabList>
            <TabPanel value="team" sx={{ p: 0, pt: 2 }}>
              <Grid container spacing={2}>
                <Grid xs={12} lg={4}>
                  <Stack spacing={2}>
                    <InfoCard
                      title="Starters"
                      icon={<Users size={20} />}
                      subtitle={`of ${roster?.players.length ?? 0} players`}
                      value={String(roster?.starters.length ?? 0)}
                    />
                    <Sheet variant="outlined" sx={{ borderRadius: "md", p: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <TrendingUp size={20} />
                        <Typography level="body-sm">Needs focus</Typography>
                      </Box>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {needs.length === 0 ? (
                          <Typography level="body-sm" color="neutral">
                            Balanced
                          </Typography>
                        ) : (
                          needs.map((n, i) => <StatusBadge key={i} label={n} />)
                        )}
                      </Box>
                    </Sheet>
                    <Sheet variant="outlined" sx={{ borderRadius: "md", p: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <LineIcon size={20} />
                        <Typography level="body-sm">Positional mix</Typography>
                      </Box>
                      <Box sx={{ height: 180 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={posCounts}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="pos" />
                            <YAxis allowDecimals={false} />
                            <ReTooltip />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Sheet>
                  </Stack>
                </Grid>
                <Grid xs={12} lg={8}>
                  <Stack spacing={2}>
                    <TableCard
                      title="Roster"
                      headers={[
                        "Name",
                        <Box
                          onClick={() => setSortByPos((p) => !p)}
                          sx={{ cursor: "pointer", userSelect: "none" }}
                        >
                          {`Pos${sortByPos ? " \u2191" : " \u21C5"}`}
                        </Box>,
                        "Team",
                        "Age",
                        "Bye",
                        "Injury",
                        <Tooltip title="Based on recent trending adds; 1 is best, 5 is worst">
                          <span>Tier</span>
                        </Tooltip>,
                        "Start",
                      ]}
                    >
                      {rosterRows.map((r) => (
                        <tr key={r.id}>
                          <td>{r.name}</td>
                          <td>{r.pos}</td>
                          <td>{r.team}</td>
                          <td>{r.age || "—"}</td>
                          <td>{r.bye}</td>
                          <td style={{ maxWidth: 140, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {r.injury || ""}
                          </td>
                          <td>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Box
                                sx={{
                                  height: 8,
                                  width: 96,
                                  bgcolor: "neutral.300",
                                  borderRadius: "sm",
                                  overflow: "hidden",
                                }}
                              >
                                <Box
                                  sx={{
                                    height: "100%",
                                    bgcolor: "primary.500",
                                    width: `${Math.round(((5 - (r.tier ?? 5)) / 4) * 100)}%`,
                                  }}
                                />
                              </Box>
                              <Typography level="body-xs" sx={{ fontFamily: "monospace" }}>
                                {r.tier ?? "—"}
                              </Typography>
                            </Box>
                          </td>
                          <td>
                            {r.starter ? (
                              <StatusBadge label="Starter" color="success" />
                            ) : (
                              <Typography level="body-xs" color="neutral">
                                —
                              </Typography>
                            )}
                          </td>
                        </tr>
                      ))}
                    </TableCard>

                    <TableCard
                      title="Trade / Waiver Targets"
                      headers={["Name", "Pos", "Team", "Tier", "Fit", "Score"]}
                    >
                      {targets.map((t) => (
                        <tr key={t.id}>
                          <td>{t.name}</td>
                          <td>{t.pos}</td>
                          <td>{t.team}</td>
                          <td>{t.tier}</td>
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
                  </Stack>
                </Grid>
              </Grid>
            </TabPanel>
            <TabPanel value="all" sx={{ p: 0, pt: 2 }}>
              <TableCard
                title="Team Comparison"
                headers={["Team", "Rating", "Top Strength", "Top Weakness"]}
              >
                {teamRatings.map((t) => (
                  <tr
                    key={t.rosterId}
                    onClick={() => {
                      setSelectedRosterId(t.rosterId);
                      setView("team");
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{t.owner}</td>
                    <td>{t.rating.toFixed(2)}</td>
                    <td>{t.strength}</td>
                    <td>{t.weakness}</td>
                  </tr>
                ))}
              </TableCard>
            </TabPanel>
          </Tabs>
        )}

        {!leagueId && (
          <Box sx={{ mt: 6, textAlign: "center" }}>
            <Typography level="h4" sx={{ mb: 1 }}>
              Welcome 👋
            </Typography>
            <Typography sx={{ maxWidth: 480, mx: "auto" }}>
              Enter your Sleeper <b>username</b> and a <b>season</b>, then click <b>Load Leagues</b>. Select a league to see your
              roster, needs, and suggested targets.
            </Typography>
            {proxyOk === false && (
              <Sheet
                variant="soft"
                color="warning"
                sx={{ mt: 2, p: 2, borderRadius: "md", maxWidth: 480, mx: "auto" }}
              >
                <Typography level="body-sm">
                  API proxy not detected. You're in <b>Mock Mode</b>. You can still click around.
                </Typography>
              </Sheet>
            )}
          </Box>
        )}
      </Box>

      <Typography level="body-xs" sx={{ textAlign: "center", py: 4 }}>
        Built for Sleeper leagues · Local cached proxy · No API keys required.
      </Typography>
    </Box>
  );
}