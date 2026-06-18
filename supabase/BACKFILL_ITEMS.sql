-- 1. Buat barang dari data Merek di note stock_in
DO $$
DECLARE
  rec RECORD;
  item_rec RECORD;
  merek_val TEXT;
  cat_val TEXT;
  new_id UUID;
BEGIN
  FOR rec IN SELECT DISTINCT ON (regexp_replace(split_part(note, 'Merek: ', 2), ' \|.*', '', 'i'))
    regexp_replace(split_part(note, 'Merek: ', 2), ' \|.*', '', 'i') as merek_name,
    regexp_replace(split_part(note, 'Kategori: ', 2), ' \|.*', '', 'i') as cat_name
  FROM stock_in
  WHERE item_id IS NULL AND note LIKE '%Merek:%'
  LOOP
    merek_val := trim(regexp_replace(rec.merek_name, '^ *| *$', '', 'g'));
    cat_val := trim(regexp_replace(rec.cat_name, '^ *| *$', '', 'g'));
    
    IF merek_val = '' THEN CONTINUE; END IF;
    
    -- Cek apakah barang sudah ada
    SELECT id INTO new_id FROM items WHERE lower(name) = lower(merek_val) LIMIT 1;
    
    IF new_id IS NULL THEN
      INSERT INTO items (code, name, stock, min_stock, unit, created_by)
      VALUES ('BRG-' || upper(md5(merek_val)), merek_val, 0, 5, 'pcs', NULL)
      RETURNING id INTO new_id;
    END IF;
    
    -- Link stock_in ke barang
    UPDATE stock_in SET item_id = new_id
    WHERE item_id IS NULL AND lower(note) LIKE '%merek: ' || lower(merek_val) || '%';
  END LOOP;
END $$;

-- 2. Buat barang dari data Merek di note stock_out (kalau belum ada)
DO $$
DECLARE
  rec RECORD;
  merek_val TEXT;
  new_id UUID;
BEGIN
  FOR rec IN SELECT DISTINCT ON (regexp_replace(split_part(note, 'Merek: ', 2), ' \|.*', '', 'i'))
    regexp_replace(split_part(note, 'Merek: ', 2), ' \|.*', '', 'i') as merek_name
  FROM stock_out
  WHERE item_id IS NULL AND note LIKE '%Merek:%'
  LOOP
    merek_val := trim(regexp_replace(rec.merek_name, '^ *| *$', '', 'g'));
    
    IF merek_val = '' THEN CONTINUE; END IF;
    
    SELECT id INTO new_id FROM items WHERE lower(name) = lower(merek_val) LIMIT 1;
    
    IF new_id IS NULL THEN
      INSERT INTO items (code, name, stock, min_stock, unit, created_by)
      VALUES ('BRG-' || upper(md5(merek_val)), merek_val, 0, 5, 'pcs', NULL)
      RETURNING id INTO new_id;
    END IF;
    
    -- Link stock_out ke barang
    UPDATE stock_out SET item_id = new_id
    WHERE item_id IS NULL AND lower(note) LIKE '%merek: ' || lower(merek_val) || '%';
  END LOOP;
END $$;

-- 3. Hitung ulang stok berdasarkan transaksi
UPDATE items SET stock = COALESCE((
  SELECT COALESCE(SUM(si.qty), 0) FROM stock_in si WHERE si.item_id = items.id
), 0) - COALESCE((
  SELECT COALESCE(SUM(so.qty), 0) FROM stock_out so WHERE so.item_id = items.id
), 0);

-- 4. Pastikan stok tidak negatif
UPDATE items SET stock = 0 WHERE stock < 0;
