import { Component, OnInit } from '@angular/core';
import { Order } from '../../model/product';
import { ApiServiceService } from '../../service/api-service.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit {
  constructor(private service: ApiServiceService) { }
  
  orders: Order[] = [];
  allOrders: Order[] = [];
  searchTerm = new FormControl('');

  ngOnInit() {
    this.loadOrders();
    this.setupFilter(); 
/*     this.searchTerm.valueChanges.subscribe(() => {
      this.orders = this.filterOrders();
    }); */
  }

  loadOrders() {
    this.service.getOrders().subscribe(orders => {
      this.orders = orders;
      this.allOrders = orders;
    });	
  }

/*   filterOrders() {
    if (!this.searchTerm.value) {
      this.loadOrders();
    }

    return this.orders.filter(order => {
      order.customerName.toLowerCase().includes(this.searchTerm.value ?? '') ||
      order.email.toLowerCase().includes(this.searchTerm.value ?? '')
    });
  } */

   setupFilter() {
    this.searchTerm.valueChanges.subscribe(searchTerm => {
      if (!searchTerm) {
        this.orders = [...this.allOrders];
        return;
      }

      const search = searchTerm.toLowerCase();
      this.orders = this.allOrders.filter(order => {
        // Verificar que las propiedades existan antes de usar toLowerCase()
        const customerName = order?.customerName?.toLowerCase() || '';
        const email = order?.email?.toLowerCase() || '';
        
        return customerName.includes(search) || email.includes(search);
      });
    });
  } 
}