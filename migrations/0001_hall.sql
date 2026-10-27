-- 공용 명예의 전당: 은퇴한 커리어 1건 = 1행
CREATE TABLE IF NOT EXISTS hall (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  look TEXT,
  peak_ovr INTEGER NOT NULL,
  fmvp INTEGER NOT NULL,
  trophies INTEGER NOT NULL,
  seasons INTEGER NOT NULL,
  retired_year INTEGER NOT NULL,
  ip_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS hall_by_ovr ON hall (peak_ovr DESC, fmvp DESC, created_at);
CREATE INDEX IF NOT EXISTS hall_by_fmvp ON hall (fmvp DESC, peak_ovr DESC, created_at);
CREATE INDEX IF NOT EXISTS hall_by_ip ON hall (ip_hash, created_at);
