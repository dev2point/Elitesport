-- Table bookings et contrainte anti-double-réservation (EXCLUDE USING gist)
-- Idempotent : n'altère pas une table ou contrainte existante sur Supabase.
-- RLS activé sans politique : bloque l'API publique PostgREST, autorise Drizzle via DATABASE_URL.

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS "bookings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "starts_at" timestamptz NOT NULL,
  "ends_at" timestamptz NOT NULL,
  "team_name" text NOT NULL,
  "phone" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "source" text NOT NULL DEFAULT 'online',
  "price_fcfa" integer NOT NULL,
  "deposit_fcfa" integer NOT NULL,
  "expires_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_no_overlap'
  ) THEN
    ALTER TABLE "bookings"
      ADD CONSTRAINT "bookings_no_overlap"
      EXCLUDE USING gist (tstzrange("starts_at", "ends_at", '[)') WITH &&)
      WHERE ("status" IN ('pending', 'confirmed'));
  END IF;
END $$;

ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;
