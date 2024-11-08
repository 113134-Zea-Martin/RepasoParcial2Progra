// src/app/models/product.model.ts
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  quantity: number;
}

export interface Order {
  id?: string;
  customerName: string;
  email: string;
  products: Product[];
  total: number;
  orderCode: string;
  timestamp: string;
}