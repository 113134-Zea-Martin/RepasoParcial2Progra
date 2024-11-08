import { Routes } from '@angular/router';
import { OrdersComponent } from './components/orders/orders.component';
import { CreateOrderComponent } from './components/create-order/create-order.component';

export const routes: Routes = [
    //Ruta para navegar a orders
    {
        path: 'orders',
        component: OrdersComponent,
    },
    {
        path: 'create-order',
        component: CreateOrderComponent,
    }
];
