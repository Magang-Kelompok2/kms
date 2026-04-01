-- CreateTable
CREATE TABLE "kelas" (
    "id_kelas" SERIAL NOT NULL,
    "nama_kelas" VARCHAR(256) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kelas_pkey" PRIMARY KEY ("id_kelas")
);

-- CreateTable
CREATE TABLE "user" (
    "id_user" SERIAL NOT NULL,
    "username" VARCHAR(256) NOT NULL,
    "email" VARCHAR(256) NOT NULL,
    "password" VARCHAR(256) NOT NULL,
    "role" VARCHAR(50),
    "id_kelas" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "tingkatan" (
    "id_tingkatan" SERIAL NOT NULL,
    "nama_tingkatan" VARCHAR(256) NOT NULL,
    "id_kelas" INTEGER NOT NULL,

    CONSTRAINT "tingkatan_pkey" PRIMARY KEY ("id_tingkatan")
);

-- CreateTable
CREATE TABLE "materi" (
    "id_materi" SERIAL NOT NULL,
    "title_materi" VARCHAR(256) NOT NULL,
    "materi_path" VARCHAR(256),
    "id_kelas" INTEGER NOT NULL,
    "id_tingkatan" INTEGER NOT NULL,

    CONSTRAINT "materi_pkey" PRIMARY KEY ("id_materi")
);

-- CreateTable
CREATE TABLE "video" (
    "id_video" SERIAL NOT NULL,
    "id_materi" INTEGER NOT NULL,
    "title_video" VARCHAR(256),
    "video_path" VARCHAR(256),

    CONSTRAINT "video_pkey" PRIMARY KEY ("id_video")
);

-- CreateTable
CREATE TABLE "pdf" (
    "id_pdf" SERIAL NOT NULL,
    "title_pdf" VARCHAR(256),
    "pdf_path" VARCHAR(256),
    "id_materi" INTEGER NOT NULL,

    CONSTRAINT "pdf_pkey" PRIMARY KEY ("id_pdf")
);

-- CreateTable
CREATE TABLE "tugas" (
    "id_tugas" SERIAL NOT NULL,
    "nama_tugas" VARCHAR(256),
    "deskripsi" TEXT,
    "type" VARCHAR(256),
    "id_materi" INTEGER NOT NULL,
    "id_kelas" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tugas_pkey" PRIMARY KEY ("id_tugas")
);

-- CreateTable
CREATE TABLE "file_pengumpulan" (
    "id_file" SERIAL NOT NULL,
    "bucket_name" VARCHAR(256),
    "object_key" VARCHAR(256),
    "ukuran_file" INTEGER,
    "original_filename" VARCHAR(256),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_pengumpulan_pkey" PRIMARY KEY ("id_file")
);

-- CreateTable
CREATE TABLE "pengumpulan" (
    "id_pengumpulan" SERIAL NOT NULL,
    "answer" TEXT,
    "id_file" INTEGER,
    "id_tugas" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pengumpulan_pkey" PRIMARY KEY ("id_pengumpulan")
);

-- CreateTable
CREATE TABLE "user_pengumpulan" (
    "id_user" INTEGER NOT NULL,
    "id_pengumpulan" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pengumpulan_pkey" PRIMARY KEY ("id_user","id_pengumpulan")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_id_kelas_fkey" FOREIGN KEY ("id_kelas") REFERENCES "kelas"("id_kelas") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tingkatan" ADD CONSTRAINT "tingkatan_id_kelas_fkey" FOREIGN KEY ("id_kelas") REFERENCES "kelas"("id_kelas") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materi" ADD CONSTRAINT "materi_id_kelas_fkey" FOREIGN KEY ("id_kelas") REFERENCES "kelas"("id_kelas") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materi" ADD CONSTRAINT "materi_id_tingkatan_fkey" FOREIGN KEY ("id_tingkatan") REFERENCES "tingkatan"("id_tingkatan") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video" ADD CONSTRAINT "video_id_materi_fkey" FOREIGN KEY ("id_materi") REFERENCES "materi"("id_materi") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdf" ADD CONSTRAINT "pdf_id_materi_fkey" FOREIGN KEY ("id_materi") REFERENCES "materi"("id_materi") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tugas" ADD CONSTRAINT "tugas_id_materi_fkey" FOREIGN KEY ("id_materi") REFERENCES "materi"("id_materi") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tugas" ADD CONSTRAINT "tugas_id_kelas_fkey" FOREIGN KEY ("id_kelas") REFERENCES "kelas"("id_kelas") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengumpulan" ADD CONSTRAINT "pengumpulan_id_file_fkey" FOREIGN KEY ("id_file") REFERENCES "file_pengumpulan"("id_file") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengumpulan" ADD CONSTRAINT "pengumpulan_id_tugas_fkey" FOREIGN KEY ("id_tugas") REFERENCES "tugas"("id_tugas") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pengumpulan" ADD CONSTRAINT "user_pengumpulan_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "user"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pengumpulan" ADD CONSTRAINT "user_pengumpulan_id_pengumpulan_fkey" FOREIGN KEY ("id_pengumpulan") REFERENCES "pengumpulan"("id_pengumpulan") ON DELETE CASCADE ON UPDATE CASCADE;
