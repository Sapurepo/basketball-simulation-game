-- 일간·주간·월간 랭킹: 등록 시각으로 거르므로 created_at 인덱스
CREATE INDEX IF NOT EXISTS hall_by_created ON hall (created_at);
