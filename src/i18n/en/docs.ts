// 게임 확률표·게임 가이드 본문 (한국어 원문 → 번역). docs.test.ts 가 빠진 키를 검사한다
const docs: Record<string, string> = {
  '게임 가이드': 'Game guide',
  '선수 만들기부터 은퇴까지 게임 흐름과 시스템 안내':
    'How the game works, from creating a player to retirement',
  '2026년 10월 30일 기준 · 코드와 같은 수치':
    'As of October 30, 2026 · same numbers as the code',
  '수상·진출·합격 판정은 대부분 "내 값이 기준 근처에서 뽑은 가상 경쟁자보다 높으면 성공" 방식이에요. 기준과 같으면 50%, 기준보다 높을수록 빠르게 올라갑니다. 실측값은 자동 플레이어로 커리어 3,000개를 돌린 결과라 실제 플레이와는 다를 수 있어요.':
    'Most award, promotion and tryout checks work as "succeed if my value beats a virtual rival drawn near the threshold". At the threshold it is 50%, and it climbs quickly above it. Measured values come from 3,000 careers played by an automated player, so real play may differ.',
  '선수 생성': 'Player creation',
  '스카우팅 리포트의 오버롤(OVR)은 능력치 7개의 포지션별 가중평균이에요. 시작 능력치 합계는 280 으로 고정이라, 다시 뽑아도 바뀌는 건 어느 능력치에 점수가 몰리느냐뿐이고 주력 능력치에 몰릴수록 오버롤이 높게 보여요. 재분배로 능력치마다 25~60 사이에서 직접 옮길 수도 있어요.':
    'The overall (OVR) on the scouting report is a position-weighted average of the 7 attributes. Starting attributes always add up to 280, so rerolling only changes where the points land, and the OVR reads higher when they pile into your main attributes. You can also move points yourself with redistribution, between 25 and 60 per attribute.',
  '오버롤과 잠재력은 따로 뽑혀서 서로 관계가 없어요. 시즌 성장은 잠재력과 오버롤의 거리에 비례하니 시작 오버롤이 높으면 성장이 느리고 낮으면 빨리 따라잡아, 몇 시즌 지나면 시작점 차이는 거의 사라지고 도달점은 잠재력이 정해요. 시작 오버롤이 높을 때의 이점은 고교 초반 출전시간과 기록뿐이에요.':
    'OVR and potential are rolled separately and have nothing to do with each other. Season growth scales with the gap between potential and OVR, so a high starting OVR grows slowly and a low one catches up fast; after a few seasons the starting difference mostly disappears and potential decides where you end up. A high starting OVR only helps with early high-school minutes and stats.',
  '잠재력은 등급 5개(S·A·B·C·D) 중 하나를 각 20% 로 고르고 그 구간 안에서 균등하게 뽑아요. 성장 기질이 천재형이면 +5, 노력형이면 −5 (60~97 안에서). 잠재력은 화면에 보이지 않아요. 성장 폭이 잠재력과의 거리에 비례하니 초반 시즌 성장 속도가 힌트예요. 스카우팅 리포트는 횟수 제한 없이 다시 뽑을 수 있고, 다시 뽑으면 잠재력도 함께 바뀌어요.':
    'Potential picks one of 5 grades (S·A·B·C·D) at 20% each, then rolls evenly within that range. A gifted growth type adds +5, a steady type −5 (kept within 60~97). Potential is never shown. Growth scales with the distance to potential, so the growth pace of the first seasons is your hint. You can reroll the scouting report as often as you like, and potential rerolls with it.',
  등급: 'Grade',
  잠재력: 'Potential',
  '생성 확률 (기질 보정 뒤)': 'Chance (after growth-type adjustment)',
  '약 24%': 'about 24%',
  '약 20%': 'about 20%',
  '약 18%': 'about 18%',
  '숨은 특성': 'Hidden trait',
  확률: 'Chance',
  효과: 'Effect',
  성장형: 'Growth curve',
  '조숙 25% · 보통 50% · 대기만성 25%': 'Early 25% · Normal 50% · Late 25%',
  '전성기 종료 33 / 35 / 36세': 'Prime ends at 33 / 35 / 36',
  '성장 기질': 'Growth type',
  '천재형 25% · 보통 50% · 노력형 25%': 'Gifted 25% · Normal 50% · Steady 25%',
  '천재형: 잠재력 +5, 오프시즌 훈련 0개면 성장 −1.0 · 노력형: 잠재력 −5, 훈련마다 성장 +0.3, 훈련 성공 시 +2':
    'Gifted: potential +5, growth −1.0 in an offseason with no drills · Steady: potential −5, growth +0.3 per drill, +2 on a passed drill',
  '부상 체질': 'Injury prone',
  '시즌 부상 확률 10% → 25%': 'Season injury chance 10% → 25%',
  클러치: 'Clutch',
  '플레이오프·아시안게임 전력 차 +1.5':
    'Playoff and Asian Games strength gap +1.5',
  '노력치: 훈련 1회마다 그 능력치의 노력치가 +1 쌓여요 (성공 여부 무관, 능력치별 20·합계 60 까지). 노력치는 시즌 성장을 그 능력치로 더 많이 나눠 주고(20 이면 집중 훈련의 두 배), 성장 총량은 바꾸지 않아요.':
    'Effort points: each drill adds +1 effort to that attribute (pass or fail, up to 20 per attribute and 60 in total). Effort steers more of the season growth into that attribute (20 equals twice the focus bonus) without changing the total.',
  '성장과 노쇠': 'Growth and decline',
  '시즌이 끝나면 OVR 변화량을 정하고 능력치에 나눠 줍니다. 성장기에는 잠재력과의 거리에 비례해서 크고, 전성기가 끝나면 조금씩, 38세부터는 크게 떨어져요. 은퇴 고민은 36세부터, 45세에는 은퇴해요.':
    'At the end of each season an OVR change is set and split across the attributes. While growing it scales with the distance to potential; after the prime it dips a little, and from 38 it drops sharply. Retirement comes up from 36 and is forced at 45.',
  조건: 'Condition',
  'OVR 변화량': 'OVR change',
  '38세 이상': 'Age 38+',
  '-(1.0 + 0.4 × (나이-38)) × 0.8~1.2, 운동능력·스피드 추가 -1':
    '-(1.0 + 0.4 × (age-38)) × 0.8~1.2, athleticism and speed an extra -1',
  '전성기 종료 ~ 37세': 'After prime, up to 37',
  '잠재력 도달': 'At potential',
  성장기: 'Growing',
  '(잠재력 - OVR) × 나이배율 × 출전배율 × 0.75~1.25':
    '(potential - OVR) × age factor × minutes factor × 0.75~1.25',
  '18세 이하': '18 or younger',
  '28 이상': '28+',
  나이배율: 'Age factor',
  '출전배율은 0.7~1.2 (평균 출전시간 비율에 비례). 훈련 보너스: 개인 트레이너 +1.5, 캠프 휴식 +0.5, 슬럼프 야간 훈련 50% +2 / 50% -1, 부상 -1, 현역 복무 -2.5, 천재형 훈련 0개 -1.0, 노력형 훈련마다 +0.3, 상점 아이템 최대 +2.0. 능력치 분배는 포지션 가중치 + 0.1 + 집중 훈련 0.2 + 노력치 × 0.02 비율이에요.':
    'The minutes factor is 0.7~1.2 (proportional to average minutes share). Growth bonuses: personal trainer +1.5, camp rest +0.5, slump night drills 50% +2 / 50% -1, injury -1, active-duty service -2.5, gifted with no drills -1.0, steady +0.3 per drill, shop items up to +2.0. Attributes split by position weight + 0.1 + focus 0.2 + effort × 0.02.',
  'OVR 95 를 넘으면 양의 성장이 절반, 97 을 넘으면 1/4 로 줄어 99 까지 가기는 어려워요.':
    'Above OVR 95 positive growth is halved, above 97 it is quartered, so reaching 99 is hard.',
  '경기와 부상': 'Games and injuries',
  '전력 차': 'Strength gap',
  '단판 승률': 'Single-game win rate',
  'OVR - 팀전력': 'OVR - team strength',
  '평균 출전 비율': 'Average minutes share',
  '출전시간은 OVR 에 (운동능력 − OVR) × 0.15 를 얹은 값으로 정해요. 운동능력이 OVR 보다 10 높으면 OVR +1.5 로 봅니다.':
    'Minutes are set from OVR plus (athleticism − OVR) × 0.15. Athleticism 10 above OVR counts as OVR +1.5.',
  '시즌 부상 확률은 10% (부상 체질 25%) 에 운동능력 배율 (1.25 − 운동능력/200) 을 곱해요. 운동능력 90 이면 0.8배, 20 이면 1.15배. 부상 시즌에는 경기마다 10~40% 확률로 결장합니다.':
    'Season injury chance is 10% (25% if injury prone) times an athleticism factor (1.25 − athleticism/200): ×0.8 at 90, ×1.15 at 20. In an injured season you miss each game with a 10~40% chance.',
  기록: 'Stat',
  '보는 능력치': 'Attributes used',
  '야투 시도': 'Field-goal attempts',
  'max(슈팅, 돌파) 85% + 스피드 15%':
    'max(shooting, finishing) 85% + speed 15%',
  '2점 성공률 · 자유투 시도': '2-point % · free-throw attempts',
  '돌파 2 : 스피드 1': 'finishing 2 : speed 1',
  '3점 성공률 · 자유투 성공률': '3-point % · free-throw %',
  '리바운드 2 : 운동능력 1': 'rebounding 2 : athleticism 1',
  '수비 1 : 스피드 1': 'defense 1 : speed 1',
  '수비 1 : 운동능력 1': 'defense 1 : athleticism 1',
  '수상 (NBA)': 'Awards (NBA)',
  '시즌 영향력 = OVR + 8×(출전비율-0.75) + 10×(팀 승률-0.5) + 경기력 보정. 팀 경기의 70% 이상 출전해야 후보예요.':
    'Season impact = OVR + 8×(minutes share-0.75) + 10×(team win%-0.5) + performance adjustment. You must play 70% of team games to qualify.',
  수상: 'Award',
  '기준 (영향력)': 'Threshold (impact)',
  'All-NBA 퍼스트 / 세컨드 / 서드': 'All-NBA First / Second / Third',
  올스타: 'All-Star',
  '올해의 신인': 'Rookie of the Year',
  'NBA 첫 시즌, 86 (sd 2)': 'First NBA season, 86 (sd 2)',
  '올해의 수비수': 'Defensive Player of the Year',
  '출전 60% 초과, 수비 능력치 95 (sd 2)':
    'Over 60% minutes, defense attribute 95 (sd 2)',
  식스맨상: 'Sixth Man',
  '출전 55% 미만, 87 (sd 1.5)': 'Under 55% minutes, 87 (sd 1.5)',
  기량발전상: 'Most Improved',
  'OVR 상승 5 (sd 1)': 'OVR gain 5 (sd 1)',
  득점왕: 'Scoring Title',
  '평균 득점 31 (sd 1.5)': '31 PPG (sd 1.5)',
  영향력: 'Impact',
  '기준-3': 'threshold-3',
  '기준-1.5': 'threshold-1.5',
  기준: 'threshold',
  '기준+1.5': 'threshold+1.5',
  '기준+3': 'threshold+3',
  'All-NBA 퍼스트': 'All-NBA First',
  'NBA 챔피언이 된 시즌에, 파이널 시리즈 평균 게임스코어(득점 + 0.7×리바 + 0.9×어시 + 1.2×(스틸+블록))로 판정합니다.':
    'In a season you win the NBA title, judged by your Finals average game score (points + 0.7×reb + 0.9×ast + 1.2×(stl+blk)).',
  '파이널 평균 게임스코어': 'Finals average game score',
  '챔피언결정전 평균 게임스코어': 'Championship series average game score',
  '수상 (KBL·대학)': 'Awards (KBL · college)',
  'KBL 첫 시즌, 63 (sd 2.5)': 'First KBL season, 63 (sd 2.5)',
  '출전 55% 미만, 66 (sd 2)': 'Under 55% minutes, 66 (sd 2)',
  '출전 50% 초과, 수비 능력치 83 (sd 3)':
    'Over 50% minutes, defense attribute 83 (sd 3)',
  '평균 득점 21 (sd 2)': '21 PPG (sd 2)',
  'OVR 상승 4.5 (sd 1)': 'OVR gain 4.5 (sd 1)',
  '평균 득점 20 (sd 2)': '20 PPG (sd 2)',
  '우승 시, 결승 게임스코어 22 (sd 5)':
    'If champion, final game score 22 (sd 5)',
  '우승 시, 결승 평균 게임스코어 20 (sd 5)':
    'If champion, finals average game score 20 (sd 5)',
  '대회 우승 + OVR ≥ 팀전력 + 2': 'Tournament title + OVR ≥ team strength + 2',
  'NBA 진출': 'Reaching the NBA',
  '고교 졸업 때 OVR 64 이상이면 미국 대학(NCAA) 제안이 2곳 와요. 미국 대학 재학 중 OVR 78 이상(리그 평균 68 보다 10 높은 상위권)이면 NBA 드래프트 선택지가 열립니다. 한국 대학에서는 KBL 을 거쳐 서머리그로 가요. 드래프트 점수 = OVR + (22-나이)×0.6 + (신장-195)/5 + 4(미국 대학 출신). 82 미만이면 미지명이고, 1라운드(30순위 안)는 약 87.7 이상이 필요해요. 아래 표는 미국 대학 출신(보정 +4 포함) 기준입니다.':
    'With OVR 64+ at high-school graduation, two US colleges (NCAA) make offers. While at a US college, OVR 78+ (10 above the league average of 68) opens the NBA draft option. From a Korean college you go through the KBL to Summer League. Draft score = OVR + (22-age)×0.6 + (height-195)/5 + 4 (US college). Below 82 you go undrafted; the first round (top 30) needs about 87.7+. The table below assumes a US-college player (+4 included).',
  'NBA 드래프트 지명': 'NBA draft pick',
  '20세 195cm': 'Age 20, 195cm',
  '22세 195cm': 'Age 22, 195cm',
  '20세 205cm': 'Age 20, 205cm',
  '21세 185cm': 'Age 21, 185cm',
  '1라운드 (20세 195cm)': 'First round (age 20, 195cm)',
  'KBL 에서 FA 때 OVR 80 이상, 또는 계약 중 OVR 82 이상이면 서머리그에 도전할 수 있어요. 합격하면 OVR 86 이상은 정식 2년, 아니면 투웨이 1년 계약입니다.':
    'In the KBL you can try Summer League with OVR 80+ as a free agent or OVR 82+ under contract. If you make it, OVR 86+ gets a 2-year standard deal, otherwise a 1-year two-way.',
  '서머리그 합격': 'Summer League success',
  제안: 'Offer',
  '계약 만료': 'Contract expires',
  'OVR 83 이상': 'OVR 83+',
  '소속팀 잔류 + 3개 구단 정식 계약':
    'Stay with your team + standard deals from 3 clubs',
  '소속팀 투웨이 1개': 'One two-way deal from your team',
  'OVR 80 미만': 'Under OVR 80',
  '제안 없음, KBL 복귀': 'No offers, back to the KBL',
  'KBL·NBA FA 때 소속팀 잔류 제안이 항상 1번에 있어요 (연봉은 다른 구단과 같은 방식). KBL 은 OVR 과 상관없이, NBA 는 OVR 80 이상이면 소속팀이 꼭 제안하니 한 팀에서 커리어를 마칠 수 있어요. 다른 구단 제안은 KBL OVR 55·NBA OVR 83 이상부터예요. 계약이 1년 남은 오프시즌에는 같은 조건으로 소속팀이 연장 계약을 제안해요. 받으면 새 연봉·연차로 바뀌고 FA 를 건너뜁니다. NBA 에서 KBL 로 돌아오거나 상무에서 전역할 때는 마지막으로 뛴 팀이 1번 (복귀) 제안이에요.':
    'In KBL and NBA free agency, staying with your team is always option 1 (salary set the same way as other clubs). The KBL always offers regardless of OVR, and the NBA always offers at OVR 80+, so you can finish your career with one team. Other clubs offer from KBL OVR 55 and NBA OVR 83. In the offseason with one year left, your team offers an extension on the same terms; accepting resets salary and years and skips free agency. When you return from the NBA to the KBL or finish military service, the team you last played for makes the first (return) offer.',
  'KBL 드래프트·입단': 'KBL draft and tryouts',
  '점수 = OVR + (22-나이)×0.3. 순위 = (75-점수)×1.2 + 1 근처이고, 20 을 넘으면 미지명이에요. 1~10순위 1라운드, 11~20순위 2라운드, 계약 3년.':
    'Score = OVR + (22-age)×0.3. Pick ≈ (75-score)×1.2 + 1; above 20 you go undrafted. Picks 1~10 are the first round, 11~20 the second, with a 3-year contract.',
  'OVR (22세)': 'OVR (age 22)',
  '지명 확률': 'Draft chance',
  '예상 순위': 'Expected pick',
  'KBL 입단 테스트 (무소속)': 'KBL tryout (unsigned)',
  합격: 'Pass',
  '병역·아시안게임': 'Military service and Asian Games',
  '22세부터 프로이고 미필이면 매년 입대 이벤트가 뜨고, 28세에는 연기할 수 없어요. 상무 불합격이면 현역 입대입니다.':
    'From 22, a pro who has not served gets an enlistment event every year, and at 28 it cannot be deferred. Failing the Sangmu (army team) tryout means active duty.',
  '국가대표 발탁': 'National team call-up',
  '아시안게임은 2030년부터 4년마다. 대회당 금메달 49.7%, 은 12.0%, 동 12.1% (실측). 금메달이면 병역 면제예요.':
    'The Asian Games run every 4 years from 2030. Per tournament: gold 49.7%, silver 12.0%, bronze 12.1% (measured). Gold exempts you from military service.',
  오프시즌: 'Offseason',
  '랜덤 이벤트는 오프시즌마다 35% 확률로 4개 중 하나가 균등하게 나와요 (각 8.75%).':
    'Each offseason there is a 35% chance of a random event, one of 4 at equal odds (8.75% each).',
  이벤트: 'Event',
  선택지: 'Choice',
  '개인 트레이너': 'Personal trainer',
  '함께 훈련': 'Train together',
  '다음 시즌 성장 +1.5': 'Next season growth +1.5',
  '해외 스킬 캠프': 'Overseas skills camp',
  '참가 / 휴식': 'Attend / Rest',
  '능력치 하나 +2 / 성장 +0.5': 'One attribute +2 / growth +0.5',
  '잠재력 +1': 'Potential +1',
  '50% 성장 +2 / 50% 성장 -1': '50% growth +2 / 50% growth -1',
  '훈련 미니게임은 6종목 12가지 중 오프시즌마다 최대 4개, 10회 중 6회 성공하면 해당 능력치 +1 (3점슛은 +2, 노력형 기질은 여기에 +1). 성공 여부와 무관하게 노력치 +1. 게이지 훈련의 초록 구간 폭은 능력치 20 이면 4%, 50 이면 8%, 99 면 15% 이고 자유투는 1.6배, 3점슛은 0.7배, 패스는 1.6배예요. 반응·타이밍 훈련도 능력치가 높을수록 허용 시간이 길어져요. 코치에게 맡기면 3~7회 성공 중 균등 추첨이라 성공 확률은 40% 입니다.':
    'Training mini-games: up to 4 per offseason out of 12 drills in 6 categories; 6 of 10 passes gives that attribute +1 (+2 for threes, +1 more for the steady type). Effort +1 regardless. The green zone of gauge drills is 4% of the gauge at attribute 20, 8% at 50 and 15% at 99, times 1.6 for free throws, 0.7 for threes and 1.6 for passing. Reaction and timing drills also allow more time at higher attributes. Leaving it to the coach draws 3~7 passes evenly, a 40% chance to pass.',
  '훈련이 커리어에 주는 영향 (자동 플레이어 커리어 1,500개, 매 오프시즌 훈련 4개 기준):':
    'How training affects a career (1,500 automated careers, 4 drills every offseason):',
  '훈련 방식': 'Training',
  '평균 최고 OVR': 'Average peak OVR',
  '하지 않음': 'None',
  '매번 코치에게 맡김': 'Always leave it to the coach',
  '매번 전부 성공': 'Always pass everything',
  '자금은 300만 원으로 시작해 고교는 시즌마다 100만 원, 대학은 300만 원이 들어오고 프로부터는 연봉이 쌓여요 (달러는 1,400원 환산). 훈련용품·착용 사치품은 보유하는 동안 시즌 능력치 버프, 장식·가구·펫·탈것은 시즌 성장 보너스를 줘요. 버프는 시즌 중에만 얹히고 성장 계산 전에 빠지지만, 그 시즌 경기 기록과 수상 판정에는 반영돼요.':
    "Cash starts at ₩3M, high school adds ₩1M per season and college ₩3M, and from the pros your salary accumulates (dollars at ₩1,400). Training gear and wearable luxury items buff attributes for the season while owned; decor, furniture, pets and rides add season growth. Buffs apply only during the season and come off before growth is calculated, but they count toward that season's stats and awards.",
  가격대: 'Price range',
  아이템: 'Items',
  '50만~500만 원': '₩500K~5M',
  '저가 벽지 6종': '6 budget wallpapers',
  '성장 +0.05 (적용 중일 때)': 'Growth +0.05 (while applied)',
  '300만~3,000만 원': '₩3M~30M',
  '훈련용품 6종': '6 training gear items',
  '능력치 하나 +1': 'One attribute +1',
  '600만~6억 원': '₩6M~600M',
  '모자 6종': '6 hats',
  '능력치 하나 +1 (쓴 것만)': 'One attribute +1 (only the one worn)',
  '1,500만~9억 원': '₩15M~900M',
  '화분·조명·선반·골대·TV·아이스 배스, 킥보드·자전거':
    'Plant, lamp, shelf, hoop, TV, ice bath, scooter, bike',
  '성장 +0.05~+0.2': 'Growth +0.05~+0.2',
  '1,800만~1.6억 원': '₩18M~160M',
  '헤어밴드·무릎 보호대·안경': 'Headband, knee pads, glasses',
  '1.2억 원~': '₩120M+',
  '러그·액자·시계·커튼·펫': 'Rug, frame, clock, curtains, pets',
  '성장 +0.1': 'Growth +0.1',
  '48억·68억 원': '₩4.8B · 6.8B',
  '소파·침대': 'Sofa, bed',
  '성장 +0.2': 'Growth +0.2',
  '690억 · 3,000억 원': '₩69B · 300B',
  '오토바이 · 홈짐 바벨 세트': 'Motorcycle · home gym barbell set',
  '성장 +0.2 · +0.5': 'Growth +0.2 · +0.5',
  '1.3조 원': '₩1.3T',
  '성장 +0.3': 'Growth +0.3',
  '효과에는 상한이 있어요. 같은 능력치의 버프는 합쳐서 +3 까지, 성장 보너스는 합쳐서 +2.0 까지예요. 벽지·바닥·모자는 하나만 적용하고 적용 중인 것만 효과가 나요. 다른 착용 아이템은 벗어도 보유 중이면 버프가 그대로예요. 등급은 가격으로 정해요: 1천만 원 미만 일반, 1억 미만 레어, 100억 미만 에픽, 그 이상 레전드.':
    'Effects are capped: buffs to one attribute add up to +3, growth bonuses to +2.0. Wallpaper, floor and hat take one at a time and only the applied one counts. Other wearables keep their buff while owned even when taken off. Tier is by price: under ₩10M common, under ₩100M rare, under ₩10B epic, above that legend.',
  '실측 (자동 플레이어, 커리어 3,000개, 2026-10-30)':
    'Measured (automated player, 3,000 careers, 2026-10-30)',
  '훈련 미니게임과 상점을 쓰지 않고 41세에 은퇴하는 단순한 플레이어 기준이라, 실제 플레이에서는 더 높게 나올 수 있어요. 훈련을 안 하므로 노력형은 손해를 본 수치예요.':
    'Based on a simple player that never trains or shops and retires at 41, so real play can score higher. Because it never trains, the steady type is undervalued here.',
  항목: 'Item',
  '미국 대학 진학': 'US college',
  'C 이하': 'C or lower',
  '성장 기질 (훈련 안 함)': 'Growth type (no training)',
  천재형: 'Gifted',
  보통: 'Normal',
  노력형: 'Steady',
  '최고 OVR 분포: 하위 10% 63 · 25% 71 · 중앙값 81 · 75% 89 · 90% 93 · 99% 97.':
    'Peak OVR distribution: 10th percentile 63 · 25th 71 · median 81 · 75th 89 · 90th 93 · 99th 97.',
  'v1.4 기준 · 처음 하는 분을 위한 안내':
    'As of v1.4 · a guide for new players',
  '벤치에서 파엠까지는 국내 고교 유망주 한 명의 농구 인생을 시즌 단위로 진행하는 시뮬레이션이에요. 고1 시즌부터 시작해 대학·KBL·NBA 를 거쳐 은퇴할 때까지, 매 시즌 끝의 선택과 오프시즌 훈련·상점으로 커리어를 만들어 갑니다. 세부 확률과 공식은 게임 확률표에 따로 있어요.':
    "Bench to Finals MVP is a season-by-season simulation of one Korean high-school prospect's basketball life. From the first year of high school through college, the KBL and the NBA to retirement, you shape the career with end-of-season choices and offseason training and shopping. Exact odds and formulas live in the Odds page.",
  '1. 선수 만들기': '1. Creating a player',
  '첫 화면의 「새로운 인생 시작하기」를 누르면 4단계로 선수를 만들어요.':
    'Press "Start a new life" on the first screen to build a player in 4 steps.',
  '아바타: 외형과 등번호를 고릅니다. 등번호는 나중에 메인 화면에서 바꿀 수 있어요.':
    'Avatar: pick a look and jersey number. You can change the number later on the main screen.',
  '기본 정보: 이름, 포지션(PG·SG·SF·PF·C), 플레이 스타일, 고등학교를 정합니다. 포지션은 오버롤 계산의 가중치와 시작 능력치 분포를, 스타일은 능력치 보너스를 정해요.':
    'Basics: name, position (PG·SG·SF·PF·C), play style and high school. Position sets the OVR weights and starting attribute spread; style adds attribute bonuses.',
  '스카우팅 리포트: 뽑힌 능력치 7개와 신장·몸무게를 봅니다. 「능력치 재분배」로 합계 280 안에서 능력치마다 25~60 사이로 옮길 수 있고, 신장은 ±4cm 조절돼요. 몸무게가 적정 체중보다 무거우면 스피드가 깎여요.':
    'Scouting report: see the 7 rolled attributes plus height and weight. "Redistribute" lets you move points within a total of 280, 25~60 per attribute, and height adjusts ±4cm. Weighing more than ideal costs speed.',
  '집중 능력치: 첫 시즌 성장을 더 받을 능력치 하나를 고릅니다. 이후에는 매 오프시즌 다시 고를 수 있어요.':
    'Focus attribute: choose one attribute to get extra growth in the first season. You can pick again every offseason.',
  '화면의 오버롤은 지금 실력일 뿐이고, 커리어를 정하는 잠재력은 보이지 않아요. 오버롤과 잠재력은 서로 무관하게 뽑히므로 다시 뽑기로 오버롤을 올려도 잠재력이 좋아지는 건 아니에요. 잠재력은 초반 몇 시즌 오버롤이 얼마나 빨리 오르는지로 짐작할 수 있습니다.':
    'The OVR on screen is only your current level; the potential that decides your career is hidden. The two are rolled independently, so rerolling for a higher OVR does not improve potential. You can guess potential from how fast OVR climbs in the first few seasons.',
  '2. 한 시즌의 흐름': '2. How a season flows',
  '메인 화면에서 「시즌 진행」을 누르면 한 시즌이 한 번에 진행돼요. 시즌이 끝나면 아래 순서로 이어집니다.':
    'Press "Play season" on the main screen to play a whole season at once. When it ends, things proceed in this order.',
  '시즌 결과: 팀 성적, 내 평균 기록, 능력치 변화, 수상, 팬 반응이 보여요. 「하이라이트」로 결승전 같은 주요 경기를 중계로 다시 볼 수 있어요.':
    'Season results: team record, your averages, attribute changes, awards and fan reactions. "Highlights" replays key games like the finals as a broadcast.',
  '오프시즌 이벤트: 진로 제안, 계약, 드래프트, 병역, 국가대표 발탁, 랜덤 이벤트가 카드로 차례차례 뜨고 선택지를 고릅니다. 결정이 남아 있으면 다음 시즌으로 넘어갈 수 없어요.':
    'Offseason events: career offers, contracts, drafts, military service, national-team call-ups and random events appear as cards one by one, and you pick an option. You cannot move on while a decision is pending.',
  '훈련: 「훈련하기」에서 오프시즌마다 미니게임을 최대 4개 하고 능력치를 바로 올립니다.':
    'Training: in "Train", play up to 4 mini-games each offseason to raise attributes right away.',
  '상점: 자금으로 아이템을 사서 능력치 버프와 성장 보너스를 받고 내 무대를 꾸밉니다.':
    'Shop: spend cash on items for attribute buffs and growth bonuses, and decorate your stage.',
  '집중 능력치: 다음 시즌에 성장을 몰아줄 능력치를 다시 고릅니다.':
    'Focus attribute: choose again which attribute gets extra growth next season.',
  '게임은 자동으로 이 브라우저에 저장돼요. 첫 화면의 「이어하기」로 돌아올 수 있고, 다른 기기로 옮기려면 오류 화면의 「저장 파일 내보내기」를 쓰세요. 브라우저 데이터를 지우면 커리어도 사라집니다.':
    'The game saves automatically in this browser. Return with "Continue" on the first screen; to move to another device, use "Export save file" on the error screen. Clearing browser data deletes the career.',
  '3. 성장의 원리': '3. How growth works',
  '시즌이 끝날 때 오버롤 변화량이 정해지고 능력치 7개에 나뉘어 들어가요. 변화량을 정하는 건 다음 네 가지예요.':
    'At season end an OVR change is set and divided among the 7 attributes. Four things decide the amount.',
  '잠재력과의 거리: 잠재력이 오버롤보다 많이 남아 있을수록 크게 자라요. 잠재력에 닿으면 거의 멈추고, 전성기가 끝나면 조금씩, 38세부터는 크게 떨어집니다.':
    'Distance to potential: the more room between OVR and potential, the bigger the growth. It nearly stops at potential, dips a little after the prime, and drops sharply from 38.',
  '나이: 어릴수록 같은 거리에서 더 많이 자라요.':
    'Age: the younger you are, the more you grow for the same gap.',
  '출전시간: 많이 뛸수록 성장이 커요. 출전시간은 오버롤이 팀 전력보다 높을수록 늘고, 운동능력이 높으면 조금 더 받아요.':
    'Minutes: the more you play, the more you grow. Minutes rise as your OVR exceeds team strength, with a small boost from athleticism.',
  '보너스: 랜덤 이벤트, 상점 아이템, 성장 기질, 부상·현역 복무 같은 가감이 더해져요.':
    'Bonuses: random events, shop items, growth type, and penalties like injury or active-duty service are added.',
  '능력치 분배는 포지션 가중치를 따르되, 집중 능력치(+0.2)와 노력치(훈련 1회마다 +1, 능력치별 20까지)가 많은 쪽으로 더 몰려요. 노력치는 성장 총량을 바꾸지 않고 방향만 바꿉니다.':
    'The split follows position weights, leaning toward the focus attribute (+0.2) and attributes with more effort (+1 per drill, up to 20 each). Effort changes only the direction of growth, not the total.',
  '선수마다 성장 기질이 있고, 메인 화면 이름 옆 뱃지로 볼 수 있어요. 천재형은 잠재력이 높지만 오프시즌에 훈련을 하나도 안 하면 성장이 둔해지고, 노력형은 잠재력이 낮은 대신 훈련할수록 성장 보너스를 받고 훈련 성공 시 능력치가 1 더 올라요. 매 오프시즌 훈련 4개를 채우면 어느 기질이든 손해가 없어요.':
    'Every player has a growth type, shown as a badge next to the name on the main screen. The gifted have higher potential but grow less in an offseason without any drills; the steady have lower potential but gain a growth bonus per drill and +1 more on a passed drill. Doing all 4 drills every offseason means no type loses out.',
  '4. 훈련 미니게임': '4. Training mini-games',
  '오프시즌마다 6종목 12가지 중 최대 4개를, 종류별로 한 번씩 할 수 있어요. 10회 중 6회 이상 성공하면 해당 능력치가 +1(3점슛은 +2, 노력형은 여기에 +1) 바로 오르고, 성공 여부와 상관없이 노력치가 +1 쌓여요. 「코치에게 맡기기」를 누르면 3~7회 성공 중 무작위로 결과가 바로 나옵니다. 모든 훈련은 키보드로도 할 수 있어요.':
    'Each offseason you can do up to 4 of the 12 drills in 6 categories, once per drill. Passing 6 of 10 attempts raises that attribute by +1 (+2 for threes, +1 more for the steady type) immediately, and effort rises +1 either way. "Leave it to the coach" draws a result of 3~7 passes instantly. Every drill also works with the keyboard.',
  종목: 'Category',
  훈련: 'Drill',
  능력치: 'Attribute',
  조작: 'Controls',
  '자유투 · 3점슛': 'Free throw · Three',
  '누르고 있다가 게이지가 초록 구간일 때 놓기':
    'Hold, then release while the gauge is in the green zone',
  '누르고 있다가 동료 거리에 맞는 초록 구간에서 놓기':
    "Hold, then release in the green zone that matches the teammate's distance",
  '공이 도착하는 순간 손 든 동료를 고르기':
    'Pick the teammate with a raised hand the moment the ball arrives',
  '림에 맞고 떨어지는 공이 점선 칸을 지날 때 점프':
    'Jump as the ball bouncing off the rim passes the dotted box',
  '페이크로 수비를 기울이고 반대쪽으로 돌파':
    'Fake to tilt the defender, then drive the other way',
  '공격수가 실제로 치고 나가는 쪽을 고르기 (잽 스텝에 속지 않기)':
    "Pick the side the attacker really drives to (don't bite on the jab step)",
  '4개 등 중 켜진 등을 빠르게 누르기':
    'Quickly tap whichever of the 4 lamps lights up',
  '벤치 프레스 · 스쿼트': 'Bench press · Squat',
  '4초 안에 버튼을 연타해 바를 끝까지 올리기':
    'Mash the button to lift the bar all the way within 4 seconds',
  '능력치가 높을수록 초록 구간이 넓어지고 허용 시간이 길어져 훈련이 쉬워져요. 게이지를 3왕복 넘게 누르고 있으면 실패예요.':
    'Higher attributes widen the green zone and allow more time, making drills easier. Holding the gauge for more than 3 round trips is a fail.',
  '5. 상점과 무대 꾸미기': '5. Shop and stage',
  '자금은 300만 원으로 시작해 고교는 시즌마다 100만 원, 대학은 300만 원이 들어오고, 프로가 되면 연봉이 쌓여요. 상점은 탭 5개로 나뉘어요.':
    'Cash starts at ₩3M; high school adds ₩1M per season and college ₩3M, and as a pro your salary accumulates. The shop has 5 tabs.',
  '훈련용품: 300만~3,000만 원. 무대에 두면 능력치 하나가 +1 이에요. 슈팅 슬리브만 선수가 착용해요.':
    'Training gear: ₩3M~30M. Placed on the stage, each gives one attribute +1. Only the shooting sleeve is worn by the player.',
  '사치품: 모자·안경·헤어밴드 같은 착용 아이템은 능력치 +1, 탈것은 성장 보너스. 모자는 하나만 쓸 수 있고 쓴 것만 효과가 나요. 다른 착용 아이템은 벗어도 효과가 그대로예요.':
    'Luxury: wearables like hats, glasses and headbands give attribute +1, rides give growth. You can wear only one hat and only the worn one counts. Other wearables keep their effect even when taken off.',
  '장식: 벽지·바닥타일·러그·액자. 벽지와 바닥은 하나씩만 적용되고 적용 중인 것만 성장 보너스를 줘요.':
    'Decor: wallpaper, floor tiles, rug, frame. One wallpaper and one floor apply at a time, and only the applied ones give growth.',
  '가구: 화분·조명·선반·골대·TV·소파·침대·홈짐 등. 놓이는 자리가 정해져 있고 성장 보너스를 줘요.':
    'Furniture: plant, lamp, shelf, hoop, TV, sofa, bed, home gym and more. Each has its own spot and gives growth.',
  '펫: 무대를 돌아다니는 강아지·고양이 10종. 성장 보너스 +0.1 이고 눌러서 쓰다듬을 수 있어요.':
    'Pets: 10 dogs and cats that roam the stage. Growth +0.1 each, and you can tap to pet them.',
  '아이템을 고르면 사기 전에 무대나 선수에게 미리 입혀 보여 주고, 효과 칸에 구매 전후 값이 나와요. 같은 능력치의 버프는 합쳐서 +3, 성장 보너스는 합쳐서 +2.0 까지만 쌓이니 상한에 걸리면 효과 칸이 +0 으로 보여요. 「배치 편집」에서 가구·탈것을 끌어 옮기고, 뒤집고, 보관할 수 있어요. 보관해도 효과는 그대로예요.':
    'Selecting an item previews it on the stage or player before buying, and the effect box shows before and after values. Buffs to one attribute cap at +3 and growth at +2.0, so a capped item shows +0. In "Arrange" you can drag furniture and rides, flip them, or store them; stored items keep their effect.',
  '6. 진로': '6. Career path',
  '고교 3시즌이 끝나면 대학 진학과 KBL 드래프트 중에서 고릅니다. 오버롤이 높으면 미국 대학(NCAA) 제안도 와요.':
    'After 3 high-school seasons you choose between college and the KBL draft. With a high OVR, US colleges (NCAA) make offers too.',
  '대학: 최대 4시즌. 2학년부터 매년 얼리 엔트리로 KBL 드래프트에 나갈 수 있어요. 미국 대학에서 오버롤이 충분히 높으면 NBA 드래프트 선택지가 열립니다.':
    'College: up to 4 seasons. From sophomore year you can enter the KBL draft early each year. At a US college a high enough OVR opens the NBA draft option.',
  'KBL: 드래프트 순위에 따라 3년 계약. 계약이 끝나면 FA 로 소속팀 잔류와 다른 구단 제안 중에서 고르고, 오버롤이 높으면 NBA 서머리그에 도전할 수 있어요. 미지명이면 무소속으로 입단 테스트를 봐요.':
    "KBL: a 3-year contract by draft position. When it ends you choose in free agency between staying and other clubs' offers, and with a high OVR you can try the NBA Summer League. If undrafted you take tryouts as an unsigned player.",
  'NBA: 드래프트 1라운드는 루키 계약, 2라운드는 투웨이 계약이에요. FA 때 제안이 없으면 KBL 로 돌아옵니다. 소속팀은 항상 잔류를 제안하니 한 팀에서 커리어를 마칠 수도 있어요.':
    'NBA: first-round picks get a rookie deal, second-round picks a two-way deal. With no offers in free agency you return to the KBL. Your team always offers to keep you, so you can finish your career with one team.',
  '병역: 22세부터 프로이고 미필이면 매년 입대 여부를 묻고 28세에는 더 미룰 수 없어요. 상무에 합격하면 D리그에서 뛰고, 불합격이면 현역으로 복무해 기량이 떨어져요. 아시안게임 금메달이면 면제예요.':
    'Military service: from 22, a pro who has not served is asked every year and cannot defer past 28. Making the Sangmu army team means playing in the D-League; failing means active duty and lost skill. An Asian Games gold exempts you.',
  '아시안게임: 2030년부터 4년마다 열리고, 오버롤이 높으면 국가대표로 뽑혀 출전해요.':
    'Asian Games: held every 4 years from 2030; with a high OVR you are called up to the national team.',
  '은퇴: 36세부터 매년 은퇴를 고민하고 45세에는 은퇴해요. 은퇴하면 은퇴식과 커리어 요약이 열려요.':
    'Retirement: from 36 you consider retiring every year, and at 45 you retire. Retiring opens a ceremony and a career summary.',
  '7. 명예의 전당': '7. Hall of Fame',
  '은퇴하면 커리어를 공용 명예의 전당에 등록할 수 있어요. 이름과 기록이 모든 플레이어에게 공개되고 한 커리어는 한 번만 올라가요. 등록된 기록은 첫 화면과 「랭킹」에서 오버롤·파이널 MVP·수입·출전시간·득점·어시스트로 정렬하고 KBL·NBA 와 등록 기간(일간·주간·월간)으로 걸러 볼 수 있어요. 기간은 한국 시간(KST) 기준으로 오늘·이번 주(월요일부터)·이번 달에 등록된 기록이고, 첫 화면에는 오늘 등록된 기록이 보여요. 선수를 누르면 상세 기록이 보이고 ←/→ 키로 넘길 수 있어요. 내 브라우저에서 은퇴한 선수는 「내 기록」 탭에 따로 남아요.':
    'After retiring you can register the career in the shared Hall of Fame. Name and stats are public to every player, and each career can be registered once. On the first screen and in "Rankings" you can sort by OVR, Finals MVPs, earnings, minutes, points and assists and filter by KBL or NBA and by registration period (daily, weekly, monthly). Periods follow Korea Standard Time (KST): today, this week from Monday, and this month. The first screen shows the entries registered today. Tap a player for details and use ←/→ to browse. Players retired in this browser also stay in the "My records" tab.',
  '8. 그 밖에': '8. Other',
  '언어: 푸터에서 한국어·영어·일본어를 바꿀 수 있어요.':
    'Language: switch between Korean, English and Japanese in the footer.',
  '경기 중계: 하이라이트 중계는 멈추거나 1x·2x·4x 로 보고 건너뛸 수 있어요. 박스스코어에 내 기록과 출전시간이 실시간으로 쌓여요.':
    'Broadcasts: highlight broadcasts can be paused, played at 1x·2x·4x or skipped. Your stats and minutes build up live in the box score.',
  '모션 줄이기: 기기의 모션 줄이기 설정을 켜면 연출이 짧아지고 훈련은 코치에게 맡기기와 같은 방식으로 진행돼요.':
    "Reduced motion: with your device's reduce-motion setting on, animations are shorter and drills run the same way as leaving them to the coach.",
  '문의: 푸터의 「문의하기」로 메일을 보내 주세요. 업데이트 내역은 「공지사항」에 있어요.':
    'Contact: email us via "Contact" in the footer. Update history is under "Notices".',
  '푸터에 게임 가이드가 생겼어요. 선수 만들기부터 은퇴까지 게임 흐름과 시스템을 안내해요.':
    'A game guide is now in the footer. It walks through the game from creating a player to retirement.',
  '게임 확률표가 영어·일본어로도 보여요. 오버롤과 잠재력의 관계, 상점 아이템 효과와 상한, 훈련이 커리어에 주는 영향이 추가됐어요.':
    'The odds page is now in English and Japanese too, with new sections on OVR vs. potential, shop item effects and caps, and how training affects a career.',
  '첫 화면이 더 빨리 떠요.': 'The first screen loads faster.',
  '한 팀에서 커리어를 마칠 수 있어요. 소속팀 잔류·연장 제안은 오버롤과 상관없이 오고, KBL 복귀나 전역 때는 마지막으로 뛴 팀이 먼저 손을 내밀어요.':
    'You can finish your career with one team. Stay and extension offers come regardless of OVR, and when you return to the KBL or finish military service, your last team reaches out first.',
  'NBA 소속으로 상무에 갔다 전역하면 NBA 계약을 받아도 무소속이 되던 문제를 고쳤어요.':
    'Fixed a bug where an NBA player returning from army service became unsigned even after receiving an NBA contract.',
  '고교 대회 MVP': 'High-school tournament MVP',
  '영어·일본어로 문서 주소에 바로 들어오면 한국어로 보이던 문제를 고쳤어요.':
    'Fixed documents showing in Korean when opened directly by URL in English or Japanese.',
  '게임이 업데이트됐어요. 페이지를 새로고침한 뒤 다시 등록해 주세요.':
    'The game has been updated. Refresh the page and register again.',
}

export default docs
