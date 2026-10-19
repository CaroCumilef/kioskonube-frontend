export interface ItemOrden {
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Orden {
  id: number;
  clienteEmail: string;
  estado: string;
  origen: string;
  total: number;
  fechaCreacion: string;
  fechaActualizacion: string | null;
  items: ItemOrden[];
}

export interface CrearOrdenRequest {
  clienteEmail: string;
  items: { productoId: number; nombreProducto: string; cantidad: number; precioUnitario: number }[];
}

export interface Despacho {
  id: number;
  ordenId: number;
  clienteEmail: string;
  estado: string;
  codigoSeguimiento: string;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  icono: string;
}

export interface ItemCarrito {
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Carrito {
  items: ItemCarrito[];
  unidades: number;
  total: number;
}

export interface CheckoutResponse {
  estado: string;
  unidades: number;
  total: number;
  fecha: string;
}
