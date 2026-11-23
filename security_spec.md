# SOLEVERSE Security Specification

## 1. Data Invariants
1. **User Isolation**: Customer documents under `/users/{userId}`, `/carts/{userId}`, and `/wishlists/{userId}` contain PII or private shopping state and may only be read or modified by the matching `request.auth.uid` (or an admin for `/users`).
2. **Role Privilege Protection**: A customer cannot self-assign an admin role on `/users/{userId}` (`role` must remain `'customer'`) and cannot write to `/admins/{uid}`.
3. **Catalog Integrity**: Only verified administrators (`isAdmin()`) may create, update, or delete `/products/{productId}`, `/categories/{categoryId}`, and `/storeSettings/{settingId}`. Customers cannot tamper with prices, stock, or discounts.
4. **Order Ownership & State Locking**: A customer may only create an `/orders/{orderId}` document where `userId == request.auth.uid`, `status == 'PLACED'`, and timestamps equal `request.time`. Customers may only read their own orders and may only cancel an order while `status == 'PLACED'`. Terminal states (`DELIVERED`, `CANCELLED`) are locked against customer mutation.
5. **Admin Isolation**: Only verified administrators may list all `/orders`, `/users`, `/contactMessages`, or `/newsletterSubscribers`, or transition order statuses through `CONFIRMED` -> `SHIPPED` -> `DELIVERED`.

## 2. The "Dirty Dozen" Attack Payloads (All Must Fail with PERMISSION_DENIED)
1. **Shadow Field Injection on User Create**: `{ "uid": "u1", "displayName": "A", "email": "a@b.com", "role": "customer", "isAdmin": true, "createdAt": "SERVER_TIME", "updatedAt": "SERVER_TIME" }`
2. **Privilege Escalation Role Update**: `{ "role": "admin", "updatedAt": "SERVER_TIME" }` sent by customer on `/users/u1`.
3. **Unauthenticated Order Creation**: Order write without `request.auth`.
4. **Identity Spoofing on Order Create**: Signed-in `u1` creating an order with `userId: "u2"`.
5. **Initial Order Status Skip**: Signed-in `u1` creating an order with `status: "DELIVERED"` or `paymentStatus: "PAID"` while claiming COD.
6. **Client-Forged Timestamp**: Order or user write with backdated `createdAt` not matching `request.time`.
7. **Cross-User Order Read / List**: Customer `u1` attempting `get(/orders/order_of_u2)` or unscoped `list(/orders)`.
8. **Customer Order Price Tampering**: Customer `u1` updating `totalInr: 1` on their own order.
9. **Terminal State Violation**: Customer `u1` cancelling an order whose existing `status` is `'SHIPPED'` or `'DELIVERED'`.
10. **Customer Product Mutation**: Signed-in non-admin updating `priceInr: 1` on `/products/prod_1`.
11. **Oversized ID Poisoning**: Creating `/orders/<200-char-invalid-id>` or `/products/bad$id!`.
12. **Unbounded Array / 1MB String Exhaustion**: Cart or Order payload containing a 10,000-character string or >50 items.
