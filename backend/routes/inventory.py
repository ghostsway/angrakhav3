from fastapi import APIRouter, Request, HTTPException
from datetime import datetime, timezone

router = APIRouter(prefix="/api")

def set_db(database):
    global db
    db = database

def set_admin_helper(require):
    global require_admin
    require_admin = require

@router.get("/admin/inventory")
async def get_inventory(request: Request):
    await require_admin(request)
    products = await db.products.find({}, {"_id": 0, "product_id": 1, "name": 1, "slug": 1, "sizes": 1, "in_stock": 1, "stock_quantity": 1, "size_stock": 1, "images": 1, "category": 1}).to_list(500)
    low_stock = []
    out_of_stock = []
    for p in products:
        size_stock = p.get("size_stock", {})
        if size_stock:
            for size, qty in size_stock.items():
                if qty == 0:
                    out_of_stock.append({"product_id": p["product_id"], "name": p["name"], "size": size, "quantity": 0})
                elif qty <= 5:
                    low_stock.append({"product_id": p["product_id"], "name": p["name"], "size": size, "quantity": qty})
        elif not p.get("in_stock", True):
            out_of_stock.append({"product_id": p["product_id"], "name": p["name"], "size": "all", "quantity": 0})
    return {"products": products, "low_stock": low_stock, "out_of_stock": out_of_stock, "total": len(products)}

@router.put("/admin/inventory/{product_id}")
async def update_inventory(product_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    update = {}
    if "size_stock" in body:
        update["size_stock"] = body["size_stock"]
        # Auto-disable if all sizes are 0
        all_zero = all(v == 0 for v in body["size_stock"].values())
        update["in_stock"] = not all_zero
    if "in_stock" in body:
        update["in_stock"] = body["in_stock"]
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.products.update_one({"product_id": product_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    return product
