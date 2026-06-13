-- ════════════════════════════════════
-- John Class · 长难句训练 Supabase 建表
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
  reading_score   INTEGER DEFAULT 0,   -- 每句 500，每周上限 1000
  vocab_score     INTEGER DEFAULT 0,   -- 词汇训练写入
  survival_score  INTEGER DEFAULT 0,   -- 生存英语，每场景 +500
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_name, week_start)
);

-- 3. 开放匿名读写权限（课堂环境，无需登录）
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_scores    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_reading_progress" ON reading_progress
  FOR ALL USING (true) WITH CHECK (true);

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

CREATE POLICY "allow_all_messages"       ON messages       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_leaderboard"    ON leaderboard    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_vocab_progress" ON vocab_progress FOR ALL USING (true) WITH CHECK (true);
