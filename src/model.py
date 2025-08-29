import pandas as pd
def starter_rate(roster_row):
    starters = set(roster_row.get("starters", []))
    players  = set(roster_row.get("players", []))
    return len(starters) / max(1, len(players))

def build_value_tiers(rosters_df, trending_df, players_df):
    # toy scoring: normalize features and combine
    p = trending_df.merge(players_df, on="player_id", how="left")
    for col in ["count"]:
        p[col] = (p[col]-p[col].mean())/(p[col].std()+1e-6)
    p["tier_score"] = p["count"].fillna(0)  # add more features as desired
    # bucket into A/B/C...
    p["tier"] = pd.qcut(p["tier_score"], 5, labels=list("EDCBA"))
    return p[["player_id","tier","tier_score"]]

def bye_gaps(league_settings, roster_players):  # pseudo: compute by position+week
    return [{"week":9,"pos":"RB","gap":2}]