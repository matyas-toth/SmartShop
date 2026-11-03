ALTER TABLE "Product" ADD CONSTRAINT "product_stock_valid" CHECK ("stock" >= 0 AND "reserved" >= 0 AND "reserved" <= "stock");
ALTER TABLE "Product" ADD CONSTRAINT "product_price_valid" CHECK ("price" >= 0);
ALTER TABLE "Coupon" ADD CONSTRAINT "coupon_values_valid" CHECK ("amount" > 0 AND (NOT "percent" OR "amount" <= 100) AND "minimum" >= 0 AND "limit" > 0 AND "used" >= 0 AND "reserved" >= 0);
ALTER TABLE "Order" ADD CONSTRAINT "order_total_valid" CHECK ("subtotal" >= 0 AND "discount" >= 0 AND "discount" <= "subtotal" AND "shippingFee" >= 0 AND "total" = "subtotal" - "discount" + "shippingFee");
ALTER TABLE "OrderItem" ADD CONSTRAINT "order_item_valid" CHECK ("price" >= 0 AND "quantity" > 0);
