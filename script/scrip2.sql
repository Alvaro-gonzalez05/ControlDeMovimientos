
CREATE TABLE participaciones (
  id BIGSERIAL PRIMARY KEY,
  movimiento_id BIGINT REFERENCES movimientos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  monto_invertido DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_participaciones_movimiento_id ON participaciones(movimiento_id);

ALTER TABLE participaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON participaciones FOR ALL USING (true);
