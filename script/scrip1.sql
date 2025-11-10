
CREATE TABLE movimientos (
  id BIGSERIAL PRIMARY KEY,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  capital_invertido DECIMAL(15,2) NOT NULL,
  precio_compra DECIMAL(10,4) NOT NULL,
  cantidad_dolares DECIMAL(15,6) NOT NULL,
  precio_venta DECIMAL(10,4) NOT NULL,
  total_venta DECIMAL(15,2) NOT NULL,
  tiene_comision BOOLEAN DEFAULT FALSE,
  tipo_comision TEXT CHECK (tipo_comision IN ('porcentaje', 'montoFinal')),
  comision_porcentaje DECIMAL(5,2),
  comision_monto DECIMAL(15,2),
  monto_final DECIMAL(15,2) NOT NULL,
  ganancia DECIMAL(15,2) NOT NULL,
  porcentaje DECIMAL(8,4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor performance
CREATE INDEX idx_movimientos_fecha ON movimientos(fecha DESC);
CREATE INDEX idx_movimientos_ganancia ON movimientos(ganancia);

-- Habilitar Row Level Security (RLS)
ALTER TABLE movimientos ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir todas las operaciones
CREATE POLICY "Allow all operations" ON movimientos FOR ALL USING (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_movimientos_updated_at 
    BEFORE UPDATE ON movimientos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
