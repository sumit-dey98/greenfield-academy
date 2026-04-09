-- Enable RLS
ALTER TABLE public.notices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admission_open ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periods        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "public read" ON public.notices        FOR SELECT USING (true);
CREATE POLICY "public read" ON public.events         FOR SELECT USING (true);
CREATE POLICY "public read" ON public.event_images   FOR SELECT USING (true);
CREATE POLICY "public read" ON public.testimonials   FOR SELECT USING (true);
CREATE POLICY "public read" ON public.admission_open FOR SELECT USING (true);
CREATE POLICY "public read" ON public.exams          FOR SELECT USING (true);
CREATE POLICY "anon read"   ON public.students       FOR SELECT USING (true);
CREATE POLICY "anon read"   ON public.teachers       FOR SELECT USING (true);
CREATE POLICY "anon read"   ON public.results        FOR SELECT USING (true);
CREATE POLICY "anon read"   ON public.attendance     FOR SELECT USING (true);
CREATE POLICY "anon read"   ON public.schedule       FOR SELECT USING (true);
CREATE POLICY "anon read"   ON public.classes        FOR SELECT USING (true);
CREATE POLICY "anon read"   ON public.subjects       FOR SELECT USING (true);
CREATE POLICY "anon read"   ON public.periods        FOR SELECT USING (true);
CREATE POLICY "anon read"   ON public.users          FOR SELECT USING (true);
CREATE POLICY "superadmin read own" ON public.superadmin FOR SELECT USING (auth.uid() = id);

-- Superadmin write (INSERT)
CREATE POLICY "superadmin write" ON public.notices        FOR INSERT TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin write" ON public.events         FOR INSERT TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin write" ON public.event_images   FOR INSERT TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin write" ON public.testimonials   FOR INSERT TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin write" ON public.admission_open FOR INSERT TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin write" ON public.students       FOR INSERT TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin write" ON public.teachers       FOR INSERT TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin write" ON public.results        FOR INSERT TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin write" ON public.attendance     FOR INSERT TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin write" ON public.schedule       FOR INSERT TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin write" ON public.classes        FOR INSERT TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin write" ON public.subjects       FOR INSERT TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin write" ON public.periods        FOR INSERT TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin write" ON public.exams          FOR INSERT TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin write" ON public.users          FOR INSERT TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin write" ON public.superadmin     FOR INSERT TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.superadmin superadmin_1 WHERE superadmin_1.id = auth.uid()));

-- Superadmin update (UPDATE)
CREATE POLICY "superadmin update" ON public.notices        FOR UPDATE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin update" ON public.events         FOR UPDATE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin update" ON public.event_images   FOR UPDATE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin update" ON public.testimonials   FOR UPDATE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin update" ON public.admission_open FOR UPDATE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin update" ON public.students       FOR UPDATE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin update" ON public.teachers       FOR UPDATE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin update" ON public.results        FOR UPDATE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin update" ON public.attendance     FOR UPDATE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin update" ON public.schedule       FOR UPDATE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin update" ON public.classes        FOR UPDATE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin update" ON public.subjects       FOR UPDATE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin update" ON public.periods        FOR UPDATE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin update" ON public.exams          FOR UPDATE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin update" ON public.users          FOR UPDATE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin update" ON public.superadmin     FOR UPDATE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin superadmin_1 WHERE superadmin_1.id = auth.uid()));

-- Superadmin delete (DELETE)
CREATE POLICY "superadmin delete" ON public.notices        FOR DELETE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin delete" ON public.events         FOR DELETE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin delete" ON public.event_images   FOR DELETE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin delete" ON public.testimonials   FOR DELETE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin delete" ON public.admission_open FOR DELETE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin delete" ON public.students       FOR DELETE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin delete" ON public.teachers       FOR DELETE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin delete" ON public.results        FOR DELETE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin delete" ON public.attendance     FOR DELETE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin delete" ON public.schedule       FOR DELETE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin delete" ON public.classes        FOR DELETE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin delete" ON public.subjects       FOR DELETE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin delete" ON public.periods        FOR DELETE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin delete" ON public.exams          FOR DELETE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin delete" ON public.users          FOR DELETE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin WHERE id = auth.uid()));
CREATE POLICY "superadmin delete" ON public.superadmin     FOR DELETE TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.superadmin superadmin_1 WHERE superadmin_1.id = auth.uid()));