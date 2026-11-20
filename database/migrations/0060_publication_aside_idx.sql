-- The aside shelf, newest first (publication/scope.ts asideCondition).
CREATE INDEX CONCURRENTLY IF NOT EXISTS publications_aside_timeline_idx
  ON publications (timeline_at DESC, article_id DESC)
  WHERE visibility = 'public' AND aside;
