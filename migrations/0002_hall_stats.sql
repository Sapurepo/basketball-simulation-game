-- 정렬 다양화: 뛴 리그(둘 다 가능), 통산 수입(만원, USD 는 1달러 1,400원 환산), 정규시즌 통산 출전시간·득점·어시스트.
-- 이전 행은 NULL 로 남고 해당 정렬에서는 뒤로, 리그 필터에서는 빠진다
ALTER TABLE hall ADD COLUMN kbl INTEGER;
ALTER TABLE hall ADD COLUMN nba INTEGER;
ALTER TABLE hall ADD COLUMN earnings INTEGER;
ALTER TABLE hall ADD COLUMN minutes INTEGER;
ALTER TABLE hall ADD COLUMN pts INTEGER;
ALTER TABLE hall ADD COLUMN ast INTEGER;
