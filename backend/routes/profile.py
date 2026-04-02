from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

router = APIRouter(prefix="/api")

def set_db(database):
    global db
    db = database

def set_helpers(require):
    global require_user
    require_user = require

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

@router.put("/profile")
async def update_profile(data: ProfileUpdate, request: Request):
    user = await require_user(request)
    update = {}
    if data.name is not None:
        update["name"] = data.name
    if data.phone is not None:
        update["phone"] = data.phone
    if update:
        update["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update})
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return user_doc

@router.post("/orders/{order_id}/reorder")
async def reorder(order_id: str, request: Request):
    user = await require_user(request)
    order = await db.orders.find_one({"order_id": order_id, "user_id": user["user_id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    # Get user cart
    cart = await db.carts.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not cart:
        import uuid
        cart = {"cart_id": f"cart_{uuid.uuid4().hex[:12]}", "user_id": user["user_id"], "items": [], "updated_at": datetime.now(timezone.utc).isoformat()}
        await db.carts.insert_one(cart)
        cart.pop("_id", None)
    items = cart.get("items", [])
    for oi in order.get("items", []):
        import uuid
        existing = next((i for i in items if i.get("product_id") == oi.get("product_id") and i.get("size") == oi.get("size")), None)
        if existing:
            existing["quantity"] += oi.get("quantity", 1)
        else:
            items.append({
                "item_id": f"item_{uuid.uuid4().hex[:8]}",
                "product_id": oi.get("product_id", ""),
                "product_slug": oi.get("product_slug", ""),
                "name": oi.get("name", ""),
                "image": oi.get("image", ""),
                "size": oi.get("size", ""),
                "color": oi.get("color", ""),
                "price": oi.get("price", 0),
                "quantity": oi.get("quantity", 1)
            })
    await db.carts.update_one({"user_id": user["user_id"]}, {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"status": "items_added", "items_count": len(order.get("items", []))}
