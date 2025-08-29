import React, { useEffect, useMemo, useState } from "react";
import { TrendingUp, Users, Trophy, Shield, LineChart as LineIcon, RefreshCw, Search, CloudOff } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  Bar,
} from "recharts";

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
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(" ");

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

// Tier heuristic (log of trending)
function computeTierScore(playerId: string, trending: TrendingItem[]): number {
  const t = trending.find((x) => x.player_id === playerId)?.count ?? 0;
  return t > 0 ? Math.min(1, Math.log10(1 + t) / 5) : 0;
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

  const startersSet = useMemo(() => new Set(myRoster?.starters || []), [myRoster]);

  const rosterRows = useMemo(() => {
    if (!myRoster || !players) return [] as any[];
    const trend = trendingAdd || [];
    return myRoster.players.map((pid) => {
      const p = players[pid];
      const tier = computeTierScore(pid, trend);
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
    }).sort((a, b) => (a.starter === b.starter ? b.tier - a.tier : (a.starter ? -1 : 1)));
  }, [myRoster, players, trendingAdd, startersSet]);

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
    const mine = new Set((myRoster?.players || []));
    const cands = trendingAdd
      .map((t) => players[t.player_id])
      .filter(Boolean)
      .filter((p) => !mine.has(p!.player_id));
    return cands
      .map((p) => {
        const tier = computeTierScore(p!.player_id, trendingAdd);
        const fit = needs.includes(positionOf(p)) ? 1 : 0;
        return { id: p!.player_id, name: nameOf(p), pos: positionOf(p), team: p?.team || "", tier, fit, score: tier + 0.3 * fit };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 25);
  }, [players, myRoster, trendingAdd, needs, rosterRows.length]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <span className="text-base font-semibold tracking-tight">Fantasy Helper</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {proxyOk === false && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                <CloudOff className="w-4 h-4" /> Mock Mode
              </span>
            )}
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
              title="Reload"
            >
              <RefreshCw className="w-4 h-4" /> Reload
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Controls */}
        <section className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Username">
            <input
              value={username as string}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Sleeper username"
            />
          </Field>
          <Field label="Season">
            <input
              value={season as string}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="2025"
            />
          </Field>
          <div className="flex items-end">
            <button
              onClick={loadLeagues}
              disabled={loading}
              className={cls(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium",
                "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 w-full"
              )}
            >
              <Search className="w-4 h-4" /> Load Leagues
            </button>
          </div>
          <div className="md:col-span-3 text-xs text-slate-500 -mt-2">API: {proxyOk === null ? "…" : proxyOk ? "connected" : "offline"}</div>
        </section>

        {/* Leagues */}
        {leagues && leagues.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Leagues</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {leagues.map((lg) => (
                <button
                  key={lg.league_id}
                  onClick={() => loadLeague(lg.league_id)}
                  className={cls(
                    "bg-white border rounded-2xl p-4 text-left shadow-sm hover:shadow transition",
                    leagueId === lg.league_id && "ring-2 ring-indigo-500"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium truncate">{lg.name || lg.league_id}</div>
                    <Trophy className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-sm text-slate-500 mt-1">Season {lg.season} · {lg.total_rosters ?? "?"} teams</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Dashboard */}
        {leagueId && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Summary cards */}
            <div className="space-y-4">
              <Card title="Starters" icon={<Users className="w-5 h-5 text-sky-600" />}
                    subtitle={`of ${myRoster?.players.length ?? 0} players`}
                    value={String(myRoster?.starters.length ?? 0)} />

              <div className="bg-white border rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-1">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <div className="text-sm text-slate-600">Needs focus</div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {needs.length === 0 ? (
                    <span className="text-sm text-slate-500">Balanced</span>
                  ) : (
                    needs.map((n, i) => <Badge key={i} label={n} />)
                  )}
                </div>
              </div>

              <div className="bg-white border rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-1">
                  <LineIcon className="w-5 h-5 text-indigo-600" />
                  <div className="text-sm text-slate-600">Positional mix</div>
                </div>
                <div className="mt-3 h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={posCounts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="pos" />
                      <YAxis allowDecimals={false} />
                      <ReTooltip />
                      <Bar dataKey="count" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right: tables */}
            <div className="lg:col-span-2 space-y-4">
              <TableCard title="Roster" headers={["Name","Pos","Team","Age","Bye","Injury","Tier","Start"]}>
                {rosterRows.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-slate-50">
                    <Td>{r.name}</Td>
                    <Td>{r.pos}</Td>
                    <Td>{r.team}</Td>
                    <Td>{r.age || "—"}</Td>
                    <Td>{r.bye}</Td>
                    <Td className="truncate max-w-[140px]">{r.injury || ""}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded bg-slate-200 overflow-hidden">
                          <div className="h-full bg-indigo-600" style={{ width: `${Math.round((r.tier || 0) * 100)}%` }} />
                        </div>
                        <span className="tabular-nums text-xs text-slate-600">{(r.tier || 0).toFixed(2)}</span>
                      </div>
                    </Td>
                    <Td>{r.starter ? <Badge label="Starter" tone="emerald" /> : <span className="text-slate-400">—</span>}</Td>
                  </tr>
                ))}
              </TableCard>

              <TableCard title="Trade / Waiver Targets" headers={["Name","Pos","Team","Tier","Fit","Score"]}>
                {targets.map((t) => (
                  <tr key={t.id} className="border-t hover:bg-slate-50">
                    <Td>{t.name}</Td>
                    <Td>{t.pos}</Td>
                    <Td>{t.team}</Td>
                    <Td>{t.tier.toFixed(2)}</Td>
                    <Td>{t.fit ? <Badge label="Need" tone="amber" /> : <span className="text-slate-400">—</span>}</Td>
                    <Td className="font-medium">{t.score.toFixed(2)}</Td>
                  </tr>
                ))}
              </TableCard>
            </div>
          </section>
        )}

        {!leagueId && (
          <div className="mt-10 grid place-items-center gap-2 text-center">
            <div className="text-xl font-semibold">Welcome 👋</div>
            <p className="text-slate-600 max-w-xl">
              Enter your Sleeper <span className="font-medium">username</span> and a <span className="font-medium">season</span>, then click
              <span className="font-semibold"> Load Leagues</span>. Select a league to see your roster, needs, and suggested targets.
            </p>
            {proxyOk === false && (
              <div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 max-w-xl">
                API proxy not detected. You're in <span className="font-semibold">Mock Mode</span>. You can still click around.
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-6 text-xs text-slate-500">
        Built for Sleeper leagues · Local cached proxy · No API keys required.
      </footer>
    </div>
  );
}

// ===== Reusable UI bits =====
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="bg-white border rounded-2xl p-4 shadow-sm text-sm text-slate-600 grid gap-2">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Card({ title, value, subtitle, icon }: { title: string; value: string; subtitle?: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {icon}
        <div className="text-sm text-slate-600">{title}</div>
      </div>
      <div className="mt-2 text-2xl font-semibold leading-tight">{value}</div>
      {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
    </div>
  );
}

function Badge({ label, tone = "indigo" }: { label: string; tone?: "indigo" | "emerald" | "amber" }) {
  const palette: Record<string, string> = {
    indigo: "bg-indigo-100 text-indigo-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-800",
  };
  return (
    <span className={cls("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", palette[tone])}>
      {label}
    </span>
  );
}

function TableCard({ title, headers, children }: { title: string; headers: string[]; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b font-medium">{title}</div>
      <div className="overflow-auto max-h-[60vh]">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10">
            <tr>
              {headers.map((h) => (
                <th key={h} className="text-left font-medium px-4 py-2 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-2 whitespace-nowrap align-middle">{children}</td>;
}