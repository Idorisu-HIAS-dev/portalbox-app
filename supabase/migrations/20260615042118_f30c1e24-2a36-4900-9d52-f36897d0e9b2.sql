
-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'petugas');
CREATE TYPE public.request_status AS ENUM ('menunggu', 'disetujui', 'ditolak');
CREATE TYPE public.notif_type AS ENUM ('stok_menipis', 'stok_habis', 'permintaan_baru', 'permintaan_disetujui', 'permintaan_ditolak', 'info');

-- =========================================
-- updated_at helper
-- =========================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles read all authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- USER ROLES (separate table)
-- =========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

CREATE POLICY "roles select own or admin" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "roles admin manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =========================================
-- AUTO PROFILE + ROLE ON SIGNUP
-- First user becomes admin; subsequent users become petugas
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INT;
  assigned_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'petugas';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- CATEGORIES
-- =========================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cat read all" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "cat admin write" ON public.categories FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_cat_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- ITEMS
-- =========================================
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 5,
  unit TEXT NOT NULL DEFAULT 'pcs',
  photo_url TEXT,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT ALL ON public.items TO service_role;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items read all" ON public.items FOR SELECT TO authenticated USING (true);
CREATE POLICY "items admin write" ON public.items FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_items_updated BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_items_category ON public.items(category_id);

-- =========================================
-- STOCK IN
-- =========================================
CREATE TABLE public.stock_in (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  qty INT NOT NULL CHECK (qty > 0),
  source TEXT,
  note TEXT,
  trx_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_in TO authenticated;
GRANT ALL ON public.stock_in TO service_role;
ALTER TABLE public.stock_in ENABLE ROW LEVEL SECURITY;
CREATE POLICY "in read all" ON public.stock_in FOR SELECT TO authenticated USING (true);
CREATE POLICY "in insert any" ON public.stock_in FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "in update admin or owner" ON public.stock_in FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR created_by = auth.uid());
CREATE POLICY "in delete admin" ON public.stock_in FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
CREATE INDEX idx_in_item ON public.stock_in(item_id);
CREATE INDEX idx_in_date ON public.stock_in(trx_date);

-- =========================================
-- STOCK OUT
-- =========================================
CREATE TABLE public.stock_out (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  qty INT NOT NULL CHECK (qty > 0),
  destination TEXT,
  note TEXT,
  trx_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_out TO authenticated;
GRANT ALL ON public.stock_out TO service_role;
ALTER TABLE public.stock_out ENABLE ROW LEVEL SECURITY;
CREATE POLICY "out read all" ON public.stock_out FOR SELECT TO authenticated USING (true);
CREATE POLICY "out insert any" ON public.stock_out FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "out update admin or owner" ON public.stock_out FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR created_by = auth.uid());
CREATE POLICY "out delete admin" ON public.stock_out FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
CREATE INDEX idx_out_item ON public.stock_out(item_id);
CREATE INDEX idx_out_date ON public.stock_out(trx_date);

-- =========================================
-- AUTO STOCK ADJUST (triggers)
-- =========================================
CREATE OR REPLACE FUNCTION public.apply_stock_in() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.items SET stock = stock + NEW.qty WHERE id = NEW.item_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.items SET stock = stock - OLD.qty WHERE id = OLD.item_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER trg_in_apply AFTER INSERT OR DELETE ON public.stock_in FOR EACH ROW EXECUTE FUNCTION public.apply_stock_in();

CREATE OR REPLACE FUNCTION public.apply_stock_out() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_stock INT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT stock INTO current_stock FROM public.items WHERE id = NEW.item_id FOR UPDATE;
    IF current_stock < NEW.qty THEN
      RAISE EXCEPTION 'Stok tidak mencukupi (tersedia: %, diminta: %)', current_stock, NEW.qty;
    END IF;
    UPDATE public.items SET stock = stock - NEW.qty WHERE id = NEW.item_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.items SET stock = stock + OLD.qty WHERE id = OLD.item_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER trg_out_apply AFTER INSERT OR DELETE ON public.stock_out FOR EACH ROW EXECUTE FUNCTION public.apply_stock_out();

-- =========================================
-- REQUESTS
-- =========================================
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  qty INT NOT NULL CHECK (qty > 0),
  requester_id UUID NOT NULL REFERENCES auth.users(id),
  note TEXT,
  status public.request_status NOT NULL DEFAULT 'menunggu',
  approver_id UUID REFERENCES auth.users(id),
  approval_note TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requests TO authenticated;
GRANT ALL ON public.requests TO service_role;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "req read all auth" ON public.requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "req insert own" ON public.requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "req update admin" ON public.requests FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "req delete admin or owner" ON public.requests FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()) OR (requester_id = auth.uid() AND status = 'menunggu'));
CREATE TRIGGER trg_req_updated BEFORE UPDATE ON public.requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- NOTIFICATIONS
-- =========================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type public.notif_type NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif read own or broadcast" ON public.notifications FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "notif update own" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "notif insert authenticated" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notif delete own admin" ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE INDEX idx_notif_user ON public.notifications(user_id, read);

-- =========================================
-- AUDIT LOG
-- =========================================
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit read admin" ON public.audit_log FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "audit insert auth" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_audit_created ON public.audit_log(created_at DESC);

-- =========================================
-- NOTIFY ADMINS ON NEW REQUEST + STOCK ALERTS
-- =========================================
CREATE OR REPLACE FUNCTION public.notify_new_request() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE admin_rec RECORD; item_name TEXT;
BEGIN
  SELECT name INTO item_name FROM public.items WHERE id = NEW.item_id;
  FOR admin_rec IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (admin_rec.user_id, 'Permintaan Baru', 'Permintaan ' || NEW.qty || ' ' || item_name || ' menunggu persetujuan.', 'permintaan_baru', '/persetujuan');
  END LOOP;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_req_notify AFTER INSERT ON public.requests FOR EACH ROW EXECUTE FUNCTION public.notify_new_request();

CREATE OR REPLACE FUNCTION public.notify_request_status() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE item_name TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT name INTO item_name FROM public.items WHERE id = NEW.item_id;
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (NEW.requester_id,
      CASE WHEN NEW.status = 'disetujui' THEN 'Permintaan Disetujui' ELSE 'Permintaan Ditolak' END,
      'Permintaan ' || item_name || ' ' || NEW.status::text,
      CASE WHEN NEW.status = 'disetujui' THEN 'permintaan_disetujui'::public.notif_type ELSE 'permintaan_ditolak'::public.notif_type END);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_req_status_notify AFTER UPDATE ON public.requests FOR EACH ROW EXECUTE FUNCTION public.notify_request_status();

CREATE OR REPLACE FUNCTION public.notify_low_stock() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE admin_rec RECORD;
BEGIN
  IF NEW.stock <> OLD.stock THEN
    IF NEW.stock = 0 AND OLD.stock > 0 THEN
      FOR admin_rec IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (admin_rec.user_id, 'Stok Habis', NEW.name || ' sudah habis.', 'stok_habis', '/data-barang');
      END LOOP;
    ELSIF NEW.stock <= NEW.min_stock AND OLD.stock > NEW.min_stock AND NEW.stock > 0 THEN
      FOR admin_rec IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (admin_rec.user_id, 'Stok Menipis', NEW.name || ' tersisa ' || NEW.stock || ' ' || NEW.unit, 'stok_menipis', '/data-barang');
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_items_low_stock AFTER UPDATE OF stock ON public.items FOR EACH ROW EXECUTE FUNCTION public.notify_low_stock();

-- Seed a few categories
INSERT INTO public.categories (name, description) VALUES
  ('Alat Tulis', 'Perlengkapan kantor dan alat tulis'),
  ('Elektronik', 'Perangkat elektronik dan aksesoris'),
  ('Konsumsi', 'Makanan & minuman'),
  ('Kebersihan', 'Perlengkapan kebersihan');
