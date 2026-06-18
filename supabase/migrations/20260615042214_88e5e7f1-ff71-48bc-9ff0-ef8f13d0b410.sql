
CREATE POLICY "item photos read auth" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'item-photos');
CREATE POLICY "item photos insert auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'item-photos');
CREATE POLICY "item photos update auth" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'item-photos');
CREATE POLICY "item photos delete auth" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'item-photos');
