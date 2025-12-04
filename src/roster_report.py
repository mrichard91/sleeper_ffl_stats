import pandas as pd
from collections import defaultdict
from functools import lru_cache
from typing import Dict, Iterable, List, Sequence, Tuple

from .utils import get, BASE


STATE_URL = f"{BASE}/state/nfl"
STARTER_EXCLUDE = {"BN", "IR", "TAXI"}


def weekly_projections(season: str, week: int) -> Dict[str, float]:
    if not week:
        return {}
    data = get(f"{BASE}/projections/nfl/{season}/{week}")
    projections = {}
    for player_id, meta in data.items():
        pts = meta.get("pts_ppr")
        if pts is None:
            pts = (meta.get("stats") or {}).get("pts_ppr")
        projections[player_id] = float(pts or 0.0)
    return projections


def resolve_league(username: str, season: str):
    """Return (user, league) for the user's first league in the season."""
    user = get(f"{BASE}/user/{username}")
    leagues = get(f"{BASE}/user/{user['user_id']}/leagues/nfl/{season}")
    if not leagues:
        raise RuntimeError(f"No leagues found for {username} in season {season}")
    if len(leagues) > 1:
        raise RuntimeError(f"Expected one league for {username}, found {len(leagues)}")
    return user, leagues[0]


def roster_for_user(league_id: str, user_id: str):
    rosters = get(f"{BASE}/league/{league_id}/rosters")
    for roster in rosters:
        if roster.get("owner_id") == user_id:
            return roster
    raise RuntimeError(f"Roster not found for user {user_id} in league {league_id}")


def weekly_points(league_id: str, roster_id: int, week: int):
    matchups = get(f"{BASE}/league/{league_id}/matchups/{week}")
    for matchup in matchups:
        if matchup.get("roster_id") == roster_id:
            return matchup.get("players_points", {}) or {}
    return {}


def season_points(league_id: str, roster_id: int, current_week: int):
    totals = defaultdict(float)
    for week in range(1, current_week + 1):
        for player_id, points in weekly_points(league_id, roster_id, week).items():
            totals[player_id] += points
    return totals


def load_players_lookup():
    data = get(f"{BASE}/players/nfl")
    lookup = {}
    for player_id, meta in data.items():
        full_name = meta.get("full_name") or (
            f"{meta.get('first_name', '').strip()} {meta.get('last_name', '').strip()}".strip()
        )
        lookup[player_id] = {
            "name": full_name or player_id,
            "position": meta.get("position", ""),
            "team": meta.get("team", ""),
        }
    return lookup


def build_starters_report(
    roster: dict, league: dict, lookup: dict, projections: dict
) -> pd.DataFrame:
    starters = [p for p in roster.get("starters", []) if p]
    slots = [pos for pos in league.get("roster_positions", []) if pos not in STARTER_EXCLUDE]
    slots = slots[: len(starters)]
    rows = []
    for slot, player_id in zip(slots, starters):
        meta = lookup.get(player_id, {})
        rows.append(
            {
                "Slot": slot or meta.get("position", ""),
                "Player": meta.get("name", player_id),
                "Team": meta.get("team", ""),
                "Projected": round(projections.get(player_id, 0.0), 2),
            }
        )
    df = pd.DataFrame(rows)
    if not df.empty:
        df.sort_values(by=["Projected", "Player"], ascending=[False, True], inplace=True)
    return df


def slot_positions(slot: str) -> Iterable[str]:
    flex_map = {
        "FLEX": {"RB", "WR", "TE"},
        "SUPER_FLEX": {"QB", "RB", "WR", "TE"},
        "WRRB_FLEX": {"WR", "RB"},
        "REC_FLEX": {"WR", "TE"},
    }
    return flex_map.get(slot, {slot})


def build_optimal_lineup(
    roster: dict, league: dict, lookup: dict, projections: dict
) -> pd.DataFrame:
    roster_positions = league.get("roster_positions", [])
    slots = [pos for pos in roster_positions if pos not in STARTER_EXCLUDE]
    allowed_map = {slot: set(slot_positions(slot)) for slot in slots}
    slots.sort(key=lambda s: len(allowed_map[s]))

    roster_players = [p for p in roster.get("players", []) if p]
    roster_players.sort(key=lambda pid: projections.get(pid, 0.0), reverse=True)
    limit = min(len(roster_players), max(len(slots) + 6, len(slots)))
    roster_players = roster_players[:limit]
    player_positions = {p: lookup.get(p, {}).get("position", "") for p in roster_players}

    @lru_cache(None)
    def dfs(slot_index: int, remaining: frozenset[str]):
        if slot_index >= len(slots) or not remaining:
            return 0.0, tuple()

        slot = slots[slot_index]
        allowed_positions = allowed_map[slot]

        best_score, best_assignment = dfs(slot_index + 1, remaining)

        for player_id in remaining:
            position = player_positions.get(player_id, "")
            if position not in allowed_positions:
                continue
            next_remaining = remaining - {player_id}
            score, assignment = dfs(slot_index + 1, next_remaining)
            score += projections.get(player_id, 0.0)
            if score >= best_score:
                best_score = score
                best_assignment = ((slot, player_id),) + assignment

        return best_score, best_assignment

    _, assignment = dfs(0, frozenset(roster_players))

    rows: List[Dict[str, str]] = []
    for slot, player_id in assignment:
        if not player_id:
            continue
        meta = lookup.get(player_id, {})
        rows.append(
            {
                "Slot": slot,
                "Player": meta.get("name", player_id),
                "Pos": meta.get("position", ""),
                "Team": meta.get("team", ""),
                "Projected": round(projections.get(player_id, 0.0), 2),
            }
        )

    df = pd.DataFrame(rows)
    if not df.empty:
        df.sort_values(by=["Slot", "Projected"], ascending=[True, False], inplace=True)
    return df


def build_roster_report(username: str):
    state = get(STATE_URL)
    season = state.get("season")
    current_week = int(state.get("week", 0))

    user, league = resolve_league(username, season)
    roster = roster_for_user(league["league_id"], user["user_id"])

    roster_players = roster.get("players", [])
    roster_id = roster.get("roster_id")
    totals = season_points(league["league_id"], roster_id, current_week)

    projections = weekly_projections(season, current_week)

    lookup = load_players_lookup()

    records = []
    for player_id in roster_players:
        meta = lookup.get(player_id, {})
        records.append(
            {
                "Player": meta.get("name", player_id),
                "Position": meta.get("position", ""),
                "Team": meta.get("team", ""),
                "Season Points": round(totals.get(player_id, 0.0), 2),
            }
        )

    df = pd.DataFrame(records)
    df.sort_values(by="Season Points", ascending=False, inplace=True)

    starters_df = build_starters_report(roster, league, lookup, projections)
    optimal_df = build_optimal_lineup(roster, league, lookup, projections)

    total_points = df["Season Points"].sum()
    avg_points = df["Season Points"].mean()
    top_performer = df.iloc[0] if not df.empty else None

    summary = {
        "league_name": league.get("name"),
        "season": season,
        "current_week": current_week,
        "total_points": round(total_points, 2),
        "avg_points": round(avg_points, 2) if not pd.isna(avg_points) else 0.0,
        "top_player": top_performer["Player"] if top_performer is not None else None,
        "top_points": top_performer["Season Points"] if top_performer is not None else None,
    }

    return df, starters_df, optimal_df, summary


def format_report(
    df: pd.DataFrame, starters_df: pd.DataFrame, optimal_df: pd.DataFrame, summary: dict
) -> str:
    lines = [
        f"League: {summary['league_name']} (Season {summary['season']}, Week {summary['current_week']})",
        f"Total team points: {summary['total_points']:.2f}",
        f"Average points per rostered player: {summary['avg_points']:.2f}",
    ]
    if summary.get("top_player"):
        lines.append(
            f"Top performer: {summary['top_player']} ({summary['top_points']:.2f} pts)"
        )
    lines.append("")
    lines.append(df.to_string(index=False))
    if df.empty:
        return "\n".join(lines)

    if summary.get("current_week"):
        lines.append("")
        lines.append("Current starters (projected points):")
        lines.append(starters_df.to_string(index=False))

        lines.append("")
        lines.append("Optimal lineup by projection:")
        lines.append(optimal_df.to_string(index=False))
    return "\n".join(lines)


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Sleeper roster report")
    parser.add_argument("username", help="Sleeper username")
    args = parser.parse_args()

    df, starters_df, optimal_df, summary = build_roster_report(args.username)
    print(format_report(df, starters_df, optimal_df, summary))


if __name__ == "__main__":
    main()
