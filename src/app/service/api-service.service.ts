import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Order, Product } from '../model/product';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiServiceService {

  constructor(private http: HttpClient) { }

  readonly API_URL = 'http://localhost:3000';

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.API_URL}/products`);
  }

  getOrderByEmail(email: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.API_URL}/orders?email=${email}`);
  }

  createOrder(order: Order): Observable<Order> {
    return this.http.post<Order>(`${this.API_URL}/orders`, order);
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.API_URL}/orders`);
  }

}
