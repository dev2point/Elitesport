-- Table payments pour le suivi des acomptes FeexPay (MTN MoMo, Moov Money, Carte)
-- RLS activé sans aucune politique : bloque totalement l'accès via l'API publique Supabase (PostgREST),
-- tout en autorisant les requêtes serveur Drizzle via DATABASE_URL.

CREATE TABLE IF NOT EXISTS "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "booking_id" uuid NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
  "amount_fcfa" integer NOT NULL CHECK ("amount_fcfa" > 0),
  "operator" text NOT NULL,
  "transaction_ref" text NOT NULL UNIQUE,
  "status" text NOT NULL CHECK ("status" IN ('pending', 'successful', 'failed')),
  "raw_status" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "payments_booking_id_idx" ON "payments" ("booking_id");

ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
