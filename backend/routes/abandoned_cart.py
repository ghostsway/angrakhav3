from fastapi import APIRouter, Request
from datetime import datetime, timezone, timedelta
import logging

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)

def set_db(database):
    global db
    db = database

def set_admin_helper(require):
    global require_admin
    require_admin = require

def set_email_config(enabled, send_fn):
    global RESEND_ENABLED, send_abandoned_cart_email
    RESEND_ENABLED = enabled
    send_abandoned_cart_email = send_fn

@router.get("/admin/abandoned-carts")
async def get_abandoned_carts(request: Request):
    await require_admin(request)
    # Carts not updated in 1+ hours with items
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    carts = await db.carts.find(
        {"items": {"$exists": True, "$ne": []}, "updated_at": {"$lt": cutoff}},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(100)
    
    # Enrich with user data
    enriched = []
    for cart in carts:
        user_id = cart.get("user_id")
        email = None
        name = None
        if user_id:
            user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "email": 1, "name": 1})
            if user:
                email = user.get("email")
                name = user.get("name")
        total = sum(i.get("price", 0) * i.get("quantity", 1) for i in cart.get("items", []))
        enriched.append({
            **cart,
            "email": email,
            "customer_name": name,
            "total_value": total,
            "item_count": len(cart.get("items", [])),
            "recovery_email_sent": cart.get("recovery_email_sent", False)
        })
    return {"carts": enriched, "total": len(enriched)}

@router.post("/admin/abandoned-carts/{cart_id}/send-reminder")
async def send_reminder(cart_id: str, request: Request):
    await require_admin(request)
    cart = await db.carts.find_one({"cart_id": cart_id}, {"_id": 0})
    if not cart:
        return {"status": "cart_not_found"}
    
    user_id = cart.get("user_id")
    if not user_id:
        return {"status": "no_user_email", "message": "Guest cart - no email available"}
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user or not user.get("email"):
        return {"status": "no_email"}
    
    if RESEND_ENABLED and send_abandoned_cart_email:
        await send_abandoned_cart_email(user["email"], user.get("name", ""), cart.get("items", []))
        await db.carts.update_one({"cart_id": cart_id}, {"$set": {"recovery_email_sent": True, "recovery_sent_at": datetime.now(timezone.utc).isoformat()}})
        return {"status": "sent", "email": user["email"]}
    
    return {"status": "email_not_configured"}
