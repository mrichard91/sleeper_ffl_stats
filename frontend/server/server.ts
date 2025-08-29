// server.ts
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import morgan from "morgan";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(morgan("tiny"));

const BASE = "https://api.sleeper.app/v1";
const playersPath = path.join(process.cwd(), "players_cache.json");
let mem: Record<string, any> = {};

async function j(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

// health
app.get("/api/health", (_, res) => res.send("ok"));

// players (cache daily)
app.get("/api/players", async (_req, res) => {
  try {
    const stat = fs.existsSync(playersPath) ? fs.statSync(playersPath) : null;
    const fresh = stat && Date.now() - stat.mtimeMs < 20 * 60 * 60 * 1000;
    if (fresh) return res.json(JSON.parse(fs.readFileSync(playersPath, "utf8")));
    const data = await j(`${BASE}/players/nfl`);
    fs.writeFileSync(playersPath, JSON.stringify(data));
    res.json(data);
  } catch (e:any) { res.status(500).json({error: e.message}); }
});

app.get("/api/user/:username", async (req, res) => {
  try { res.json(await j(`${BASE}/user/${encodeURIComponent(req.params.username)}`)); }
  catch (e:any) { res.status(500).json({error: e.message}); }
});

app.get("/api/user/:uid/leagues/:season", async (req, res) => {
  try { res.json(await j(`${BASE}/user/${req.params.uid}/leagues/nfl/${req.params.season}`)); }
  catch (e:any) { res.status(500).json({error: e.message}); }
});

app.get("/api/league/:id/users", async (req, res) => {
  try { res.json(await j(`${BASE}/league/${req.params.id}/users`)); }
  catch (e:any) { res.status(500).json({error: e.message}); }
});

app.get("/api/league/:id/rosters", async (req, res) => {
  try { res.json(await j(`${BASE}/league/${req.params.id}/rosters`)); }
  catch (e:any) { res.status(500).json({error: e.message}); }
});

// trending adds/drops
app.get("/api/players/trending/:kind", async (req, res) => {
  const { kind } = req.params; // add | drop
  const { limit = "50", lookback_hours = "168" } = req.query;
  try {
    res.json(await j(`${BASE}/players/nfl/trending/${kind}?limit=${limit}&lookback_hours=${lookback_hours}`));
  } catch (e:any) { res.status(500).json({error: e.message}); }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`API on :${PORT}`));