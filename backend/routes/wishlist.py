from fastapi import APIRouter, Request, HTTPException
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/api")

def set_db(database):
    global db
    db = database

def set_helpers(get_user, require):
    global get_current_user, require_user
    get_current_user = get_user
    require_user = require

@router.get("/wishlist")
async def get_wishlist(request: Request):
    user = await require_user(request)
    wishlist = await db.wishlists.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not wishlist:
        return {"items": []}
    # Enrich with product data
    product_ids = [item["product_id"] for item in wishlist.get("items", [])]
    products = await db.products.find({"product_id": {"$in": product_ids}}, {"_id": 0}).to_list(100)
    product_map = {p["product_id"]: p for p in products}
    enriched = []
    for item in wishlist.get("items", []):
        prod = product_map.get(item["product_id"])
        if prod:
            enriched.append({**item, "product": prod})
    return {"items": enriched}

@router.post("/wishlist/{product_id}")
async def add_to_wishlist(product_id: str, request: Request):
    user = await require_user(request)
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    wishlist = await db.wishlists.find_one({"user_id": user["user_id"]})
    if not wishlist:
        await db.wishlists.insert_one({
            "user_id": user["user_id"],
            "items": [{"product_id": product_id, "added_at": datetime.now(timezone.utc).isoformat()}],
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
    else:
        existing = [i for i in wishlist.get("items", []) if i["product_id"] == product_id]
        if not existing:
            await db.wishlists.update_one(
                {"user_id": user["user_id"]},
                {"$push": {"items": {"product_id": product_id, "added_at": datetime.now(timezone.utc).isoformat()}},
                 "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
            )
    return {"status": "added", "product_id": product_id}

@router.delete("/wishlist/{product_id}")
async def remove_from_wishlist(product_id: str, request: Request):
    user = await require_user(request)
    await db.wishlists.update_one(
        {"user_id": user["user_id"]},
        {"$pull": {"items": {"product_id": product_id}},
         "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "removed", "product_id": product_id}

@router.get("/wishlist/check/{product_id}")
async def check_wishlist(product_id: str, request: Request):
    user = await get_current_user(request)
    if not user:
        return {"in_wishlist": False}
    wishlist = await db.wishlists.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not wishlist:
        return {"in_wishlist": False}
    in_wl = any(i["product_id"] == product_id for i in wishlist.get("items", []))
    return {"in_wishlist": in_wl}
