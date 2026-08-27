# Manifest Layar Desain — AksiCendekia

Sumber: ekspor Google Stitch, 28 folder: 24 layar aplikasi, 2 eksperimen WebGL, 1 aset logo, 1 folder berisi `DESIGN.md`. Dari 24 layar itu, 8 folder `mathquest_*` adalah arsip non-kanon (lihat bagian Dasbor siswa). Setiap folder di `design/stitch/` berisi `code.html` (Tailwind, referensi visual saja) dan `screen.png`.

**Aturan pakai:** agent HANYA membaca folder yang ditandai untuk feature yang sedang dikerjakan. Jangan membaca seluruh folder — akan membakar context window tanpa manfaat.

**Token kanon:** `design/DESIGN.md`. Seluruh 24 layar terverifikasi memakai palet 47 token dan skala tipografi 7 token yang identik — tidak ada drift.

---

## Layar aplikasi

| Folder | Layar | Feature |
|---|---|---|
| `aksicendekia_registrasi_login` | Login & registrasi, satu layar dengan pemilih peran (Student / Parent / Teacher / School Admin) | 002 |
| `aksicendekia_onboarding_persetujuan` | Onboarding, pemilihan jenjang, dan persetujuan orang tua | 002 |
| `aksicendekia_kuis_sedang_berjalan` | Sesi kuis berjalan | 004 |
| `aksicendekia_hasil_kuis` | Layar hasil kuis | 004 |
| `aksicendekia_editor_butir_soal_cms` | Admin CMS — editor butir soal | 003 |
| `aksicendekia_dasbor_orang_tua_guru` | Dasbor orang tua & guru | 007 |
| `aksicendekia_upgrade_pro_paywall` | Halaman upgrade Pro & paywall lembut | 008 |
| `aksicendekia_status_sistem_empty_error_loading` | Empty / error / loading state | 001 |

## Dasbor siswa per jenjang

**KANON: `eduquest_*`.** Folder `mathquest_*` adalah versi lama dari sebelum rebranding MathQuest → AksiCendekia. Disimpan sebagai arsip, **JANGAN dibaca dan JANGAN dijadikan acuan implementasi.**

| Folder | Layar | Feature |
|---|---|---|
| `eduquest_dunia_angka_tk` | Dasbor TK | 001, 005 |
| `eduquest_sd_hero_journey` | Dasbor SD — Peta Misi, streak, papan peringkat, power-up | 001, 005, 006 |
| `eduquest_smp_space_lab` | Dasbor SMP | 001, 005 |
| `eduquest_sma_future_scientist` | Dasbor SMA | 001, 005 |

Diabaikan (arsip): `mathquest_dunia_angka_tk`, `mathquest_sd_hero_journey`, `mathquest_smp_space_lab`, `mathquest_sma_future_scientist`, beserta keempat varian `*_animated`-nya.

## Layar mata pelajaran

| Folder | Layar | Feature |
|---|---|---|
| `eduquest_belajar_bahasa_tk` | Bahasa Inggris TK | 003 |
| `eduquest_petualangan_sains_sd` | Sains SD | 003 |
| `eduquest_lorong_waktu_smp` | Sejarah SMP | 003 |
| `eduquest_laboratorium_fisika_sma` | Fisika SMA | 003 |

## Aset lain

| Folder | Isi | Feature |
|---|---|---|
| `logo_aksicendekia_alternatif_1` | Varian logo | 001 |
| `mathquest_*_animated` (4 folder) | Varian beranimasi dari dasbor `mathquest_*` (non-kanon). Referensi motion saja, opsional | — |
| `mathquest_geometric_adventure` | Hanya berisi `DESIGN.md` (sudah disalin ke `design/DESIGN.md`). Tidak ada layar | — |
| `shader`, `three.js` | Eksperimen WebGL, ~8KB, hanya `code.html`. **Di luar cakupan seluruh feature** | — |

---

## Catatan yang harus dibaca agent sebelum implementasi

1. Seluruh `code.html` memuat Tailwind lewat `cdn.tailwindcss.com` — referensi visual saja, JANGAN disalin ke kode aplikasi.
2. Terdapat 77 gambar yang di-hotlink ke `lh3.googleusercontent.com` (17 di antaranya di layar `aksicendekia_*`). Seluruhnya harus diganti aset lokal.
3. Ikon memakai font Material Symbols dari CDN. Diganti `lucide-react`.
4. Bahasa antarmuka tercampur: layar siswa dominan Bahasa Indonesia, layar admin/CMS dan sebagian label form dalam Bahasa Inggris. Seluruh string melewati layer i18n dengan Bahasa Indonesia sebagai default — jangan menyalin literal Bahasa Inggris dari desain.
5. Peran pada layar login tertulis "School Admin", bukan admin platform. Bedakan keduanya di Feature 002.
