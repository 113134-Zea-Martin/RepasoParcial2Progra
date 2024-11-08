import { Component, OnInit } from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
  FormArray,
  ValidationErrors,
  AsyncValidator,
  AsyncValidatorFn,
  AbstractControl,
} from '@angular/forms';
import { ApiServiceService } from '../../service/api-service.service';
import { Order, Product } from '../../model/product';
import { CommonModule } from '@angular/common';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-order',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-order.component.html',
  styleUrl: './create-order.component.css',
})
export class CreateOrderComponent implements OnInit {

  onSubmit() {
    if (this.orderForm.valid) {
      this.createOrder();
    }
  }
  //Injectamos el servicio
  constructor(private apiService: ApiServiceService,
    private router: Router) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  orderForm: FormGroup = new FormGroup({
    customerName: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
    ]),
    email: new FormControl('', [Validators.required, Validators.email], [this.emailOrderLimitValidator()]),

    products: new FormArray(
      [],
      [Validators.required, this.uniqueProductsValidator, this.validateTotalQuantity]
    ),
  });

  get productsFormArray() {
    return this.orderForm.get('products') as FormArray;
  }

  //Implementar un validador sincrónico personalizado para el FormArray de productos que:
  // Valide que no existan productos duplicados en el pedido
  // Debe implementarse usando la siguiente estructura:
  uniqueProductsValidator(control: FormArray): ValidationErrors | null {
    const selectedProductsIds = control.controls.map(
      (c) => c.get('productId')?.value as Number
    );
    const hasDuplicates = selectedProductsIds.some(
      (productId, index) => selectedProductsIds.indexOf(productId) !== index
    );
    return hasDuplicates ? { uniqueProducts: true } : null;
  }


  //La cantidad total de productos no debe superar las 10 unidades
  validateTotalQuantity(control: FormArray): ValidationErrors | null {
    const totalQuantity = control.controls.reduce(
      (acc, c) => acc + c.get('quantity')?.value,
      0
    );
    return totalQuantity > 10 ? { totalQuantity: true } : null;
  }

  orders: Order[] = [];

  getOrdersByEmail(email: string) {
    this.apiService.getOrderByEmail(email).subscribe({
      next: (data) => {
        this.orders = data;
      },
      error: (e) => {
        console.error(e);
      },
    });
  }


  emailOrderLimitValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return this.apiService.getOrderByEmail(control.value).pipe(
        tap((orders) => {
          console.log('Órdenes obtenidas:', orders);
        }),
        map(orders => {
          // Obtenemos la fecha actual
          const now = new Date();
          // Filtramos los pedidos de las últimas 24 horas
          const recentOrders = orders.filter(order => {
            const orderDate = order.timestamp ? new Date(order.timestamp) : new Date();
            const differenceInMilliseconds = now.getTime() - orderDate.getTime();
            console.log('Diferencia en milisegundos:', differenceInMilliseconds);
            // Convertimos la diferencia a horas diviendo por 1000 milisegundos, 
            //60 segundos y 60 minutos
            const differenceInHours = differenceInMilliseconds / (1000 * 60 * 60);
            console.log('Diferencia en horas:', differenceInHours);
            return differenceInHours <= 2400;
          });

          // Si hay más de 3 pedidos en las últimas 24 horas, retornamos el error
          if (recentOrders.length >= 3) {
            console.log('Error al validar el límite de pedidos:', recentOrders);
            return { errorPedido: true };
          }

          return null;
        }),
        catchError((error) => {
          console.error('Error al validar el límite de pedidos:', error);
          return of(null);
        })
      );
    };
  }

  quantity?: number;

  addProduct() {
    const productForm: FormGroup = new FormGroup({
      productId: new FormControl(''),
      quantity: new FormControl(1, [Validators.required, Validators.min(1)]),
      price: new FormControl(0),
      stock: new FormControl(0),
    });

    productForm.get('productId')?.valueChanges.subscribe((productId) => {
      const product = this.products.find((p) => p.id === productId);
      console.log(productId);
      if (product) {
        console.log(product.price),
          productForm.patchValue({
            // Actualizamos el precio y stock del producto
            price: product.price,
            stock: product.stock,
          });

        // Validamos que la cantidad no sea mayor al stock
        productForm
          .get('quantity')
          ?.setValidators([
            Validators.required,
            Validators.min(1),
            Validators.max(product.stock),
          ]);
        this.calculateTotal();
        this.updateSelectedProducts();
      }
    });

    productForm.get('quantity')?.valueChanges.subscribe(() => {
      this.calculateTotal();
      this.updateSelectedProducts();
    });

    this.productsFormArray.push(productForm);
  }

  selectedProducts: Product[] = [];

  updateSelectedProducts() {
    this.selectedProducts = this.productsFormArray.controls.map((control) => {
      const product = this.products.find(
        (p) => p.id === control.get('productId')?.value
      );
      return {
        id: product?.id || '',
        name: product?.name || '',
        quantity: control.get('quantity')?.value,
        price: control.get('price')?.value * control.get('quantity')?.value,
        stock: control.get('stock')?.value,
      };
    }) as Product[];
  }

  removeProduct(index: number) {
    this.productsFormArray.removeAt(index);
    this.calculateTotal();
    this.updateSelectedProducts();
  }

  //Obtenemos los productos
  products: Product[] = [];
  loadProducts() {
    this.apiService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
      },
      error: (e) => {
        console.error(e);
      },
    });
  }


  total: number = 0;
  hasDescount: boolean = false;

  //Calculamos el total del pedido y aplicamos un descuento del 10% si el total supera los $1000
  calculateTotal() {
    let subtotal = 0;
    this.productsFormArray.controls.forEach((control) => {
      const product = this.products.find(
        (p) => p.id === control.get('productId')?.value
      );
      if (product) {
        subtotal += product.price * control.get('quantity')?.value;
      }
    });
    // Aplicamos el descuento si el total supera los $1000
    this.total = subtotal;
    this.hasDescount = subtotal > 1000;
    if (this.hasDescount) {
      this.total = subtotal * 0.9;
    }

  }



  createOrder() {
    if (this.orderForm.valid) {
      this.generateOrderCode();
      const formsValue = this.orderForm.value;
      const order: Order = {
        customerName: formsValue.customerName,
        email: formsValue.email,
        products: this.orderForm.get('products')?.value,
        total: parseFloat(this.total.toFixed(2)),
        orderCode: this.orderCode,
        timestamp: new Date().toISOString(),
      };

      this.apiService.createOrder(order).subscribe({
        next: (data) => {
          console.log('Orden creada:', data);
          this.router.navigate(['/orders']);
        },
        error: (e) => {
          console.error(e);
        },
      });
    }
  }

  
  orderCode: string = '';

  generateOrderCode() {
    const timestamp = new Date().toJSON();
    this.orderCode = 
    this.orderForm.get('customerName')?.value.charAt(0).toUpperCase() +
    this.orderForm.get('email')?.value.slice(-4) +
    timestamp;
  }

}