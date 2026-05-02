import uuid
from datetime import datetime, timezone

def set_db(database):
    global db
    db = database

async def _get_cart(user_id=None, guest_token=None):
    query = {"user_id": user_id} if user_id else {"guest_token": guest_token}
    cart = await db.carts.find_one(query, {"_id": 0})
    if not cart:
        cart = {
            "cart_id": f"cart_{uuid.uuid4().hex[:12]}",
            "user_id": user_id, "guest_token": guest_token,
            "items": [], "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.carts.insert_one(cart)
        cart.pop("_id", None)
    return cart
