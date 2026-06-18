-- Jalankan ini saja di SQL Editor → Run

-- Insert profile untuk semua user yang belum punya
INSERT INTO public.profiles (id, full_name)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Insert role untuk semua user yang belum punya
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'petugas'::public.app_role
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id, role) DO NOTHING;
