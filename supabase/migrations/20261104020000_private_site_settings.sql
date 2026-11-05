begin;
-- Public visitors now use /api/site-settings, which masks the original resume URL.
-- The existing admin policy continues to allow authenticated administrators access.
drop policy if exists "Site settings are public" on public.site_settings;
revoke select on public.site_settings from anon;
grant select on public.site_settings to service_role;
notify pgrst, 'reload schema';
commit;
