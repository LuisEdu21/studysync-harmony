-- Create profile for any user that doesn't have one yet
insert into public.profiles (user_id, display_name, weekly_goal_minutes)
select 
  au.id,
  coalesce(au.raw_user_meta_data->>'full_name', au.email) as display_name,
  600 as weekly_goal_minutes
from auth.users au
where not exists (
  select 1 from public.profiles p where p.user_id = au.id
);