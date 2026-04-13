DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_progress'
      AND column_name = 'tingkatan_saat_ini'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_progress'
      AND column_name = 'id_tingkatan'
  ) THEN
    ALTER TABLE public.user_progress
      ADD COLUMN id_tingkatan integer;

    UPDATE public.user_progress
    SET id_tingkatan = tingkatan_saat_ini
    WHERE id_tingkatan IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'hasil_kuis'
      AND column_name = 'id_hasil'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'hasil_kuis'
      AND column_name = 'jumlah_percobaan'
  ) THEN
    ALTER TABLE public.hasil_kuis
      ADD COLUMN jumlah_percobaan integer NOT NULL DEFAULT 1;
  END IF;
END $$;
