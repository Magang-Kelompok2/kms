CREATE TABLE IF NOT EXISTS public.user_materi_file (
  id_user integer NOT NULL,
  id_materi integer NOT NULL,
  file_type character varying(20) NOT NULL,
  file_id integer NOT NULL,
  completed_at timestamp without time zone DEFAULT now(),
  CONSTRAINT user_materi_file_pkey PRIMARY KEY (id_user, file_type, file_id),
  CONSTRAINT user_materi_file_id_user_fkey FOREIGN KEY (id_user) REFERENCES public."user"(id_user) ON DELETE CASCADE,
  CONSTRAINT user_materi_file_id_materi_fkey FOREIGN KEY (id_materi) REFERENCES public.materi(id_materi) ON DELETE CASCADE,
  CONSTRAINT user_materi_file_type_check CHECK (file_type IN ('pdf', 'video'))
);

CREATE INDEX IF NOT EXISTS user_materi_file_user_materi_idx
  ON public.user_materi_file (id_user, id_materi);
