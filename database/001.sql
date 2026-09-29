-- Small-store transactional adapter. One locked state row provides atomic
-- payment/order/variant/audit commits. See docs/BACKEND.md for scaling limits.
CREATE TABLE IF NOT EXISTS fliq_state (
 id integer PRIMARY KEY CHECK(id=1), data jsonb NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS fliq_images (
 id uuid PRIMARY KEY, mime text NOT NULL,
 bytes bytea NOT NULL CHECK(octet_length(bytes)<=5242880),
 created_at timestamptz NOT NULL DEFAULT now()
);
