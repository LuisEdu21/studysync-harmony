-- Ensure unique constraint for upsert
create unique index if not exists ux_study_stats_user_date on public.study_stats (user_id, date);

-- Function: apply session inserts to study_stats and refresh streak
create or replace function public.apply_session_to_study_stats()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_date date;
begin
  -- Only count study time; treat null session_type as 'study'
  if coalesce(new.session_type, 'study') = 'study' then
    v_date := (new.completed_at at time zone 'utc')::date;

    -- Upsert today's aggregate for the session's date
    insert into public.study_stats (user_id, date, total_study_minutes, sessions_count)
    values (new.user_id, v_date, coalesce(new.duration_minutes, 0), 1)
    on conflict (user_id, date) do update
      set total_study_minutes = public.study_stats.total_study_minutes + coalesce(excluded.total_study_minutes, 0),
          sessions_count      = public.study_stats.sessions_count + 1,
          updated_at          = now();

    -- Update streak_days snapshot on current date
    insert into public.study_stats (user_id, date, total_study_minutes, sessions_count, streak_days)
    values (new.user_id, current_date, 0, 0, public.calculate_user_streak(new.user_id))
    on conflict (user_id, date) do update
      set streak_days = public.calculate_user_streak(new.user_id),
          updated_at  = now();
  end if;

  return new;
end;
$$;

-- Trigger: after insert on study_sessions
drop trigger if exists trg_apply_session_to_study_stats on public.study_sessions;
create trigger trg_apply_session_to_study_stats
after insert on public.study_sessions
for each row execute function public.apply_session_to_study_stats();

-- Backfill last 30 days from study_sessions into study_stats
with agg as (
  select
    user_id,
    (completed_at at time zone 'utc')::date as date,
    sum(duration_minutes) filter (where coalesce(session_type,'study') = 'study') as total_minutes,
    count(*) filter (where coalesce(session_type,'study') = 'study') as sessions
  from public.study_sessions
  where completed_at >= now() - interval '30 days'
  group by user_id, (completed_at at time zone 'utc')::date
)
insert into public.study_stats (user_id, date, total_study_minutes, sessions_count)
select user_id, date, coalesce(total_minutes, 0), coalesce(sessions, 0)
from agg
on conflict (user_id, date) do update
  set total_study_minutes = excluded.total_study_minutes,
      sessions_count      = excluded.sessions_count,
      updated_at          = now();

-- Refresh streak snapshot for today for all users with stats today
update public.study_stats s
set streak_days = public.calculate_user_streak(s.user_id),
    updated_at  = now()
where s.date = current_date;