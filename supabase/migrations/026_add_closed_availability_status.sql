-- Add 'closed' status for campgrounds closed for the season (grey in calendar)
ALTER TABLE availability DROP CONSTRAINT IF EXISTS availability_status_check;
ALTER TABLE availability ADD CONSTRAINT availability_status_check
  CHECK (status IN ('available','booked','closed','locked','unknown','opening_soon'));
