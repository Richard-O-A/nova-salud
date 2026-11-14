create table if not exists usuarios (
  id serial primary key,
  nombre varchar(100) not null,
  email varchar(100) not null unique,
  password varchar(255) not null,
  rol varchar(20) not null default 'vendedor',
  created_at timestamptz default now()
);

create table if not exists productos (
  id serial primary key,
  nombre varchar(120) not null,
  categoria varchar(60),
  precio numeric(10,2) not null check (precio >= 0),
  stock int not null default 0 check (stock >= 0),
  stock_minimo int not null default 5,
  created_at timestamptz default now()
);

create table if not exists ventas (
  id serial primary key,
  cliente varchar(100),
  total numeric(10,2) not null default 0,
  usuario_id int references usuarios(id),
  fecha timestamptz default now()
);

create table if not exists detalle_ventas (
  id serial primary key,
  venta_id int not null references ventas(id) on delete cascade,
  producto_id int not null references productos(id),
  cantidad int not null check (cantidad > 0),
  precio_unitario numeric(10,2) not null,
  subtotal numeric(10,2) not null
);

create table if not exists movimientos (
  id serial primary key,
  producto_id int not null references productos(id),
  tipo varchar(10) not null check (tipo in ('ENTRADA','SALIDA')),
  cantidad int not null check (cantidad > 0),
  saldo int not null,
  motivo varchar(100),
  venta_id int references ventas(id),
  fecha timestamptz default now()
);

alter table usuarios enable row level security;
alter table productos enable row level security;
alter table ventas enable row level security;
alter table detalle_ventas enable row level security;
alter table movimientos enable row level security;
