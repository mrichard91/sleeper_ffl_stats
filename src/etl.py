import os, pandas as pd
from .utils import get, BASE, nightly_players_cache

def load_leagues(user_or_id, season):
    # resolve user_id
    user = get(f"{BASE}/user/{user_or_id}")
    leagues = get(f"{BASE}/user/{user['user_id']}/leagues/nfl/{season}")
    return user, pd.DataFrame(leagues)

def league_frames(league_id):
    rosters = get(f"{BASE}/league/{league_id}/rosters")
    users   = get(f"{BASE}/league/{league_id}/users")
    picks   = get(f"{BASE}/league/{league_id}/traded_picks")
    return (pd.DataFrame(rosters), pd.DataFrame(users), pd.DataFrame(picks))

def players_frame():
    players = nightly_players_cache()
    df = (pd.DataFrame(players).T
            .reset_index(names="player_id")
            [["player_id","first_name","last_name","position","team","age","injury_status","practice_participation","fantasy_positions"]])
    return df