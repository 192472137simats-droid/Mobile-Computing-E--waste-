-- Remove the known placeholder administrator account from earlier installations.
UPDATE public.users
SET is_active = false
WHERE email = 'admin@vestige.internal'
  AND password_hash = '$2a$12$e6mZt65P3y21r5XNf2lRxe46GZ/P698UjUa9lX19b52wYQ0p3H90.';

-- The application stores audit details as text. Keep the database column aligned.
ALTER TABLE public.admin_actions
  ALTER COLUMN details TYPE TEXT USING details::text,
  ALTER COLUMN details SET DEFAULT '{}';
