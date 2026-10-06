CREATE SCHEMA "public";
CREATE TABLE "url" (
	"id" serial PRIMARY KEY,
	"original_url" text NOT NULL,
	"short_code" varchar,
	"created_at" timestamp DEFAULT now(),
	"access_count" integer DEFAULT 0
);
CREATE UNIQUE INDEX "url_pkey" ON "url" ("id");