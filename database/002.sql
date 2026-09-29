-- Indexed read models updated in the SAME transaction as business state.
CREATE TABLE IF NOT EXISTS fliq_products (
 id text PRIMARY KEY, data jsonb NOT NULL,
 search tsvector GENERATED ALWAYS AS (to_tsvector('simple',data::text)) STORED
);
CREATE INDEX IF NOT EXISTS fliq_products_search ON fliq_products USING gin(search);
CREATE INDEX IF NOT EXISTS fliq_products_collections ON fliq_products USING gin((data->'collections'));
CREATE INDEX IF NOT EXISTS fliq_products_status ON fliq_products ((data->>'status'));
CREATE TABLE IF NOT EXISTS fliq_orders (
 id text PRIMARY KEY, data jsonb NOT NULL,
 search tsvector GENERATED ALWAYS AS (to_tsvector('simple',data::text)) STORED
);
CREATE UNIQUE INDEX IF NOT EXISTS fliq_orders_payment_unique ON fliq_orders ((data->>'payment_id'));
CREATE UNIQUE INDEX IF NOT EXISTS fliq_orders_checkout_unique ON fliq_orders ((data->>'checkout_id'));
CREATE INDEX IF NOT EXISTS fliq_orders_search ON fliq_orders USING gin(search);
CREATE INDEX IF NOT EXISTS fliq_orders_status_date ON fliq_orders ((data->>'status'),(data->>'created_at') DESC);
CREATE INDEX IF NOT EXISTS fliq_orders_payment_date ON fliq_orders ((data->>'payment_status'),(data->>'created_at') DESC);
INSERT INTO fliq_products(id,data) SELECT p->>'id',p FROM fliq_state, jsonb_array_elements(data->'products') p WHERE fliq_state.id=1 ON CONFLICT(id) DO NOTHING;
INSERT INTO fliq_orders(id,data) SELECT o->>'id',o FROM fliq_state, jsonb_array_elements(data->'orders') o WHERE fliq_state.id=1 ON CONFLICT(id) DO NOTHING;
