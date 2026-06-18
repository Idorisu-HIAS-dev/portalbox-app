-- Buat item_id nullable di stock_in dan stock_out
ALTER TABLE public.stock_in ALTER COLUMN item_id DROP NOT NULL;
ALTER TABLE public.stock_out ALTER COLUMN item_id DROP NOT NULL;
