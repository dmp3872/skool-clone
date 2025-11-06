/*
  # Add Member Approval System

  ## Changes
  - Add approval_status column to users table
  - Set existing users to 'approved' status
  - Add constraint to validate status values
  - New users will be set to 'pending' by default in application code

  ## Approval Status Values
  - 'pending': User has registered but not yet approved by admin
  - 'approved': User has been approved and can access the platform
  - 'rejected': User has been rejected by admin
*/

-- Add approval_status column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved'
CHECK(approval_status IN ('pending', 'approved', 'rejected'));

-- Update existing users to approved status (grandfather existing users)
UPDATE users
SET approval_status = 'approved'
WHERE approval_status IS NULL;

-- Create index for faster queries on approval status
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);

-- Add comment to column for documentation
COMMENT ON COLUMN users.approval_status IS 'Approval status for new member registration: pending, approved, or rejected';
