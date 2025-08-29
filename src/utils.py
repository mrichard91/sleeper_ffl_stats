import os, time, json, requests
from dotenv import load_dotenv
load_dotenv()

BASE = "https://api.sleeper.app/v1"

def get(url, params=None, tries=3):
    for i in range(tries):
        r = requests.get(url, params=params, timeout=30)
        if r.status_code == 429 and i < tries-1:
            time.sleep(1.5 * (i+1))
            continue
        r.raise_for_status()
        return r.json()
    raise RuntimeError(f"GET failed: {url}")

def nightly_players_cache(path="data/players_nfl.json"):
    if os.path.exists(path) and (time.time() - os.path.getmtime(path) < 20*60*60):
        return json.load(open(path))
    data = get(f"{BASE}/players/nfl")  # cache daily; ~5MB
    os.makedirs(os.path.dirname(path), exist_ok=True)
    json.dump(data, open(path, "w"))
    return data