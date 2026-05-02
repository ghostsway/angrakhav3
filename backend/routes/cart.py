import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException

from models import CartItemAdd, CartItemUpdate
from utils.cart_helpers import _get_cart

router = APIRouter(prefix="/api")

def set_db(database):
    global db
    db = database

def set_helpers(get_user, require, get_guest):
    global get_current_user, require_user, get_guest_token
    get_current_user = get_user
    require_user = require
    get_guest_token = get_guest

@router.get("/cart")
async def get_cart(request: Request):
    user = await get_current_user(request)
    guest_token = get_guest_token(request)
    if user:
        cart = await _get_cart(user_id=user["user_id"])
    elif guest_token:
        cart = await _get_cart(guest_token=guest_token)
    else:
        return {"cart_id": "", "items": [], "updated_at": ""}
    return cart

@router.post("/cart/items")
async def add_to_cart(item: CartItemAdd, request: Request):
    user = await get_current_user(request)
    guest_token = get_guest_token(request)
    if user:
        cart = await _get_cart(user_id=user["user_id"])
        query = {"user_id": user["user_id"]}
    elif guest_token:
        cart = await _get_cart(guest_token=guest_token)
        query = {"guest_token": guest_token}
    else:
        raise HTTPException(status_code=400, detail="Guest token or auth required")
    items = cart.get("items", [])
    existing = next((i for i in items if i["product_id"] == item.product_id and i["size"] == item.size), None)
    if existing:
        existing["quantity"] += item.quantity
    else:
        items.append({
            "item_id": f"item_{uuid.uuid4().hex[:8]}",
            **item.model_dump()
        })
    await db.carts.update_one(query, {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}})
    cart["items"] = items
    return cart

@router.put("/cart/items/{item_id}")
async def update_cart_item(item_id: str, update: CartItemUpdate, request: Request):
    user = await get_current_user(request)
    guest_token = get_guest_token(request)
    if user:
        query = {"user_id": user["user_id"]}
    elif guest_token:
        query = {"guest_token": guest_token}
    else:
        raise HTTPException(status_code=400, detail="Guest token or auth required")
    cart = await db.carts.find_one(query, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    items = cart.get("items", [])
    for i, item in enumerate(items):
        if item["item_id"] == item_id:
            if update.quantity <= 0:
                items.pop(i)
            else:
                items[i]["quantity"] = update.quantity
            break
    await db.carts.update_one(query, {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}})
    cart["items"] = items
    return cart

@router.delete("/cart/items/{item_id}")
async def remove_cart_item(item_id: str, request: Request):
    user = await get_current_user(request)
    guest_token = get_guest_token(request)
    if user:
        query = {"user_id": user["user_id"]}
    elif guest_token:
        query = {"guest_token": guest_token}
    else:
        raise HTTPException(status_code=400, detail="Guest token or auth required")
    cart = await db.carts.find_one(query, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    items = [i for i in cart.get("items", []) if i["item_id"] != item_id]
    await db.carts.update_one(query, {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}})
    cart["items"] = items
    return cart

@router.post("/cart/merge")
async def merge_cart(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Auth required")
    body = await request.json()
    guest_token = body.get("guest_token", "")
    if not guest_token:
        return {"status": "no guest cart"}
    guest_cart = await db.carts.find_one({"guest_token": guest_token}, {"_id": 0})
    if not guest_cart or not guest_cart.get("items"):
        return {"status": "empty guest cart"}
    user_cart = await _get_cart(user_id=user["user_id"])
    merged_items = user_cart.get("items", [])
    for gi in guest_cart["items"]:
        existing = next((i for i in merged_items if i["product_id"] == gi["product_id"] and i["size"] == gi["size"]), None)
        if existing:
            existing["quantity"] += gi["quantity"]
        else:
            merged_items.append(gi)
    await db.carts.update_one({"user_id": user["user_id"]}, {"$set": {"items": merged_items, "updated_at": datetime.now(timezone.utc).isoformat()}})
    await db.carts.delete_one({"guest_token": guest_token})
    return {"status": "merged", "items": merged_items}
