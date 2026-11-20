-- Material the prefilter set aside (ASIDE: ads, product listings, timeless reads): relevant to the
-- industry but not news. It reaches no news surface; a module's shelf lists it (publication/rules.ts isAside).
ALTER TABLE publications ADD COLUMN IF NOT EXISTS aside boolean NOT NULL DEFAULT false;
