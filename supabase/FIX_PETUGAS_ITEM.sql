-- Petugas boleh tambah/ubah barang
DROP POLICY IF EXISTS "items admin write" ON public.items;
CREATE POLICY "items all auth write" ON public.items FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
