-- Make item_id nullable in requests table so users can request without selecting a specific item
ALTER TABLE requests ALTER COLUMN item_id DROP NOT NULL;
