/*
  # Disable Email Confirmation Requirement

  ## Changes
  - Auto-confirm all new user emails during registration
  - Create a trigger to automatically set email_confirmed_at for new auth users
  
  ## Purpose
  Allow users to register and login immediately without email verification
*/

-- Create a function to auto-confirm emails
CREATE OR REPLACE FUNCTION auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically confirm email for new users
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS auto_confirm_email_trigger ON auth.users;

-- Create trigger to auto-confirm emails on user creation
CREATE TRIGGER auto_confirm_email_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_email();

-- Confirm any existing unconfirmed users
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;