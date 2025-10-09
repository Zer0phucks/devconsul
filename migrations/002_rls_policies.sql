-- Profiles: Users can read/update own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Social connections: Users can manage own connections
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own connections" ON public.social_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own connections" ON public.social_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own connections" ON public.social_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own connections" ON public.social_connections FOR DELETE USING (auth.uid() = user_id);

-- Pain points: Users can manage own pain points
ALTER TABLE public.pain_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own pain points" ON public.pain_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pain points" ON public.pain_points FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pain points" ON public.pain_points FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pain points" ON public.pain_points FOR DELETE USING (auth.uid() = user_id);

-- GitHub repos: Users can manage own repos
ALTER TABLE public.github_repos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own repos" ON public.github_repos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own repos" ON public.github_repos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own repos" ON public.github_repos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own repos" ON public.github_repos FOR DELETE USING (auth.uid() = user_id);

-- GitHub issues: Users can manage issues for their pain points
ALTER TABLE public.github_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own issues" ON public.github_issues FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.pain_points
    WHERE pain_points.id = github_issues.pain_point_id
    AND pain_points.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own issues" ON public.github_issues FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.pain_points
    WHERE pain_points.id = github_issues.pain_point_id
    AND pain_points.user_id = auth.uid()
  ));
CREATE POLICY "Users can update own issues" ON public.github_issues FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.pain_points
    WHERE pain_points.id = github_issues.pain_point_id
    AND pain_points.user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own issues" ON public.github_issues FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.pain_points
    WHERE pain_points.id = github_issues.pain_point_id
    AND pain_points.user_id = auth.uid()
  ));

-- Devlog posts: Users can manage own posts
ALTER TABLE public.devlog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own posts" ON public.devlog_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own posts" ON public.devlog_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.devlog_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.devlog_posts FOR DELETE USING (auth.uid() = user_id);

-- Analytics events: Users can only insert own events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own events" ON public.analytics_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events" ON public.analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id);
