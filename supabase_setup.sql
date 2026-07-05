-- ════════════════════════════════════
-- John Class · Supabase 建表（全量）
-- 在 Supabase > SQL Editor 中运行以下 SQL
-- ════════════════════════════════════

-- 1. 阅读进度表
CREATE TABLE IF NOT EXISTS reading_progress (
  user_name          TEXT PRIMARY KEY,
  current_sentence_id INTEGER DEFAULT 1,
  total_completed    INTEGER DEFAULT 0,
  saved_ids          INTEGER[] DEFAULT '{}',
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 每周分数表（阅读 + 词汇 + 生存英语 合并）
CREATE TABLE IF NOT EXISTS weekly_scores (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name      TEXT NOT NULL,
  week_start     DATE NOT NULL,
  reading_score   INTEGER DEFAULT 0,   -- 阅读本周新增分
  vocab_score     INTEGER DEFAULT 0,   -- 词汇训练写入
  survival_score  INTEGER DEFAULT 0,   -- 生存英语，每场景 +500
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_name, week_start)
);

-- 3. 开放匿名读写权限（课堂环境，无需登录）
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_scores    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_reading_progress" ON reading_progress;
CREATE POLICY "allow_all_reading_progress" ON reading_progress
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_weekly_scores" ON weekly_scores;
CREATE POLICY "allow_all_weekly_scores" ON weekly_scores
  FOR ALL USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════
-- 词汇训练写入 weekly_scores 的方式：
-- 在 vocab.html 的得分逻辑里，调用：
--
-- INSERT INTO weekly_scores (user_name, week_start, vocab_score)
-- VALUES ($name, $weekStart, $points)
-- ON CONFLICT (user_name, week_start)
-- DO UPDATE SET vocab_score = weekly_scores.vocab_score + $points,
--               updated_at = NOW();
--
-- 用 Supabase anon key + REST API 调用即可，
-- 格式与 reading_sentence.html 中的 sbUpsert 相同。
--
-- 生存英语同理，写入 survival_score 列：
-- ON CONFLICT (user_name, week_start)
-- DO UPDATE SET survival_score = weekly_scores.survival_score + $points
-- ════════════════════════════════════════════

-- 4. 留言板表（teacher.html 使用）
CREATE TABLE IF NOT EXISTS messages (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  grade      TEXT,
  content    TEXT,
  reply_to   UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 词汇排行榜旧表（vocab.html 仍在使用）
CREATE TABLE IF NOT EXISTS leaderboard (
  name       TEXT PRIMARY KEY,
  score      INTEGER DEFAULT 0,
  grade      TEXT,
  data       JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 词汇+生存英语通用进度表
CREATE TABLE IF NOT EXISTS vocab_progress (
  user_name      TEXT PRIMARY KEY,
  progress_data  JSONB DEFAULT '{}',
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════
-- RLS 策略（所有表开放访问）
-- ════════════════════════════════════════
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard    ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_messages" ON messages;
CREATE POLICY "allow_all_messages"       ON messages       FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "allow_all_leaderboard" ON leaderboard;
CREATE POLICY "allow_all_leaderboard"    ON leaderboard    FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "allow_all_vocab_progress" ON vocab_progress;
CREATE POLICY "allow_all_vocab_progress" ON vocab_progress FOR ALL USING (true) WITH CHECK (true);

-- ════════════════════════════════════════
-- 6.1 统一云端进度表
-- 每个学生一行；每个板块一个独立格子：
-- vocab / reading / grammar / writing / survival / programmer
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_progress (
  user_name      TEXT PRIMARY KEY,
  progress_data  JSONB DEFAULT '{}',
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_user_progress" ON user_progress;
CREATE POLICY "allow_all_user_progress" ON user_progress FOR ALL USING (true) WITH CHECK (true);

-- ════════════════════════════════════════
-- 7. weekly_scores 加列（如尚未添加）
-- ════════════════════════════════════════
ALTER TABLE weekly_scores ADD COLUMN IF NOT EXISTS programmer_score INTEGER DEFAULT 0;
ALTER TABLE weekly_scores ADD COLUMN IF NOT EXISTS grammar_score    INTEGER DEFAULT 0;
ALTER TABLE weekly_scores ADD COLUMN IF NOT EXISTS writing_score    INTEGER DEFAULT 0;
ALTER TABLE weekly_scores ADD COLUMN IF NOT EXISTS vocab_round      INTEGER DEFAULT 0;
ALTER TABLE weekly_scores ADD COLUMN IF NOT EXISTS victory_msg     TEXT;

-- ════════════════════════════════════════
-- 8. 口语累积榜（生存英语，永久不清零）
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS speaking_scores (
  user_name  TEXT PRIMARY KEY,
  score      INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════
-- 9. 码神累积榜（发音+口语+程序员单词，永久不清零）
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS programmer_scores (
  user_name  TEXT PRIMARY KEY,
  score      INTEGER DEFAULT 0,
  vocab_score INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE programmer_scores ADD COLUMN IF NOT EXISTS vocab_score INTEGER DEFAULT 0;

-- ════════════════════════════════════════
-- 10. 语法累积榜（永久不清零）
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS grammar_scores (
  user_name  TEXT PRIMARY KEY,
  score      INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════
-- RLS 策略
-- ════════════════════════════════════════
ALTER TABLE speaking_scores    ENABLE ROW LEVEL SECURITY;
ALTER TABLE programmer_scores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE grammar_scores     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_speaking_scores" ON speaking_scores;
CREATE POLICY "allow_all_speaking_scores"    ON speaking_scores    FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "allow_all_programmer_scores" ON programmer_scores;
CREATE POLICY "allow_all_programmer_scores"  ON programmer_scores  FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "allow_all_grammar_scores" ON grammar_scores;
CREATE POLICY "allow_all_grammar_scores"     ON grammar_scores     FOR ALL USING (true) WITH CHECK (true);

-- ════════════════════════════════════════
-- 11. 写作累积榜（永久不清零）
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS writing_scores (
  user_name  TEXT PRIMARY KEY,
  score      INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE writing_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_writing_scores" ON writing_scores;
CREATE POLICY "allow_all_writing_scores" ON writing_scores FOR ALL USING (true) WITH CHECK (true);

-- ════════════════════════════════════════
-- 12. 词汇速度挑战榜（按年级分榜）
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS speed_scores (
  grade      TEXT NOT NULL,
  name       TEXT NOT NULL,
  score      INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (grade, name)
);

ALTER TABLE speed_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_speed_scores" ON speed_scores;
CREATE POLICY "allow_all_speed_scores" ON speed_scores FOR ALL USING (true) WITH CHECK (true);

-- ════════════════════════════════════════
-- 13. 公告栏
-- teacher.html 使用 id='1'：论坛公告
-- study.html 使用 id='global'：学习中心表扬公告
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS bulletin (
  id         TEXT PRIMARY KEY,
  content   TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bulletin ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_bulletin" ON bulletin;
CREATE POLICY "allow_all_bulletin" ON bulletin FOR ALL USING (true) WITH CHECK (true);

-- ════════════════════════════════════════
-- 14. 每日学习战报
-- jc-daily.js 自动写入：学习时间、当日各板块得分、战报数据
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS daily_logs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name     TEXT NOT NULL,
  log_date      DATE NOT NULL,
  progress_data JSONB DEFAULT '{}',
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_name, log_date)
);

ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_daily_logs" ON daily_logs;
CREATE POLICY "allow_all_daily_logs" ON daily_logs FOR ALL USING (true) WITH CHECK (true);
