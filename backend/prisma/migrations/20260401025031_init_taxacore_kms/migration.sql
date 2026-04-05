-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.file_pengumpulan (
  id_file integer NOT NULL DEFAULT nextval('file_pengumpulan_id_file_seq'::regclass),
  bucket_name character varying,
  object_key character varying,
  ukuran_file integer,
  original_filename character varying,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT file_pengumpulan_pkey PRIMARY KEY (id_file)
);
CREATE TABLE public.kelas (
  id_kelas integer NOT NULL DEFAULT nextval('kelas_id_kelas_seq'::regclass),
  nama_kelas character varying NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT kelas_pkey PRIMARY KEY (id_kelas)
);
CREATE TABLE public.materi (
  id_materi integer NOT NULL DEFAULT nextval('materi_id_materi_seq'::regclass),
  title_materi character varying NOT NULL,
  materi_path character varying,
  id_kelas integer NOT NULL,
  id_tingkatan integer NOT NULL,
  pertemuan integer NOT NULL DEFAULT 1,
  deskripsi text,
  CONSTRAINT materi_pkey PRIMARY KEY (id_materi),
  CONSTRAINT materi_id_kelas_fkey FOREIGN KEY (id_kelas) REFERENCES public.kelas(id_kelas),
  CONSTRAINT materi_id_tingkatan_fkey FOREIGN KEY (id_tingkatan) REFERENCES public.tingkatan(id_tingkatan)
);
CREATE TABLE public.pdf (
  id_pdf integer NOT NULL DEFAULT nextval('pdf_id_pdf_seq'::regclass),
  title_pdf character varying,
  pdf_path character varying,
  id_materi integer NOT NULL,
  CONSTRAINT pdf_pkey PRIMARY KEY (id_pdf),
  CONSTRAINT pdf_id_materi_fkey FOREIGN KEY (id_materi) REFERENCES public.materi(id_materi)
);
CREATE TABLE public.pengumpulan (
  id_pengumpulan integer NOT NULL DEFAULT nextval('pengumpulan_id_pengumpulan_seq'::regclass),
  answer text,
  id_file integer,
  id_tugas integer NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pengumpulan_pkey PRIMARY KEY (id_pengumpulan),
  CONSTRAINT pengumpulan_id_file_fkey FOREIGN KEY (id_file) REFERENCES public.file_pengumpulan(id_file),
  CONSTRAINT pengumpulan_id_tugas_fkey FOREIGN KEY (id_tugas) REFERENCES public.tugas(id_tugas)
);
CREATE TABLE public.tingkatan (
  id_tingkatan integer NOT NULL DEFAULT nextval('tingkatan_id_tingkatan_seq'::regclass),
  nama_tingkatan character varying NOT NULL,
  id_kelas integer NOT NULL,
  CONSTRAINT tingkatan_pkey PRIMARY KEY (id_tingkatan),
  CONSTRAINT tingkatan_id_kelas_fkey FOREIGN KEY (id_kelas) REFERENCES public.kelas(id_kelas)
);
CREATE TABLE public.tugas (
  id_tugas integer NOT NULL DEFAULT nextval('tugas_id_tugas_seq'::regclass),
  nama_tugas character varying,
  deskripsi text,
  type USER-DEFINED NOT NULL DEFAULT 'Tugas'::"Penugasan",
  id_materi integer NOT NULL,
  id_kelas integer NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  pertemuan integer NOT NULL DEFAULT 1,
  deadline timestamp without time zone,
  CONSTRAINT tugas_pkey PRIMARY KEY (id_tugas),
  CONSTRAINT tugas_id_materi_fkey FOREIGN KEY (id_materi) REFERENCES public.materi(id_materi),
  CONSTRAINT tugas_id_kelas_fkey FOREIGN KEY (id_kelas) REFERENCES public.kelas(id_kelas)
);
CREATE TABLE public.user (
  id_user integer NOT NULL DEFAULT nextval('user_id_user_seq'::regclass),
  username character varying NOT NULL,
  email character varying NOT NULL,
  password character varying NOT NULL,
  role character varying,
  id_kelas integer,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_pkey PRIMARY KEY (id_user),
  CONSTRAINT user_id_kelas_fkey FOREIGN KEY (id_kelas) REFERENCES public.kelas(id_kelas)
);
CREATE TABLE public.user_pengumpulan (
  id_user integer NOT NULL,
  id_pengumpulan integer NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_pengumpulan_pkey PRIMARY KEY (id_user, id_pengumpulan),
  CONSTRAINT user_pengumpulan_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.user(id_user),
  CONSTRAINT user_pengumpulan_id_pengumpulan_fkey FOREIGN KEY (id_pengumpulan) REFERENCES public.pengumpulan(id_pengumpulan)
);
CREATE TABLE public.user_progress (
  id_progress integer NOT NULL DEFAULT nextval('user_progress_id_progress_seq'::regclass),
  id_user integer NOT NULL,
  id_kelas integer NOT NULL,
  tingkatan_saat_ini integer NOT NULL DEFAULT 1,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_progress_pkey PRIMARY KEY (id_progress),
  CONSTRAINT user_progress_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.user(id_user),
  CONSTRAINT user_progress_id_kelas_fkey FOREIGN KEY (id_kelas) REFERENCES public.kelas(id_kelas)
);
CREATE TABLE public.video (
  id_video integer NOT NULL DEFAULT nextval('video_id_video_seq'::regclass),
  id_materi integer NOT NULL,
  title_video character varying,
  video_path character varying,
  CONSTRAINT video_pkey PRIMARY KEY (id_video),
  CONSTRAINT video_id_materi_fkey FOREIGN KEY (id_materi) REFERENCES public.materi(id_materi)
);