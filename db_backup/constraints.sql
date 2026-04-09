ALTER TABLE public.teachers
  ADD CONSTRAINT teachers_subject_id_fkey
    FOREIGN KEY (subject_id) REFERENCES public.subjects(id);

ALTER TABLE public.classes
  ADD CONSTRAINT classes_teacher_id_fkey
    FOREIGN KEY (teacher_id) REFERENCES public.teachers(id);

ALTER TABLE public.events
  ADD CONSTRAINT event_images_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES public.events(id);

ALTER TABLE public.event_images
  ADD CONSTRAINT event_images_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES public.events(id);

ALTER TABLE public.results
  ADD CONSTRAINT results_subject_id_fkey
    FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  ADD CONSTRAINT results_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE,
  ADD CONSTRAINT results_exam_id_fkey
    FOREIGN KEY (exam_id) REFERENCES public.exams(id);

ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.schedule
  ADD CONSTRAINT schedule_class_id_fkey
    FOREIGN KEY (class_id) REFERENCES public.classes(id),
  ADD CONSTRAINT schedule_subject_id_fkey
    FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  ADD CONSTRAINT schedule_teacher_id_fkey
    FOREIGN KEY (teacher_id) REFERENCES public.teachers(id),
  ADD CONSTRAINT schedule_period_id_fkey
    FOREIGN KEY (period_id) REFERENCES public.periods(id);

ALTER TABLE public.students
  ADD CONSTRAINT students_class_id_fkey
    FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;

ALTER TABLE public.teachers
  ADD CONSTRAINT teachers_class_id_fkey
    FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;

ALTER TABLE public.superadmin
  ADD CONSTRAINT superadmin_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id);