ALTER TABLE "CartItem" ADD CONSTRAINT "cart_quantity_valid" CHECK ("quantity" >= 1 AND "quantity" <= 99);
