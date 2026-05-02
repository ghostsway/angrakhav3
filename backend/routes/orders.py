import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException

from models import CheckoutCreate
from utils.cart_helpers import _get_cart

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)

def set_db(database):
    global db
    db = database

def set_helpers(get_user, require, get_guest):
    global get_current_user, require_user, get_guest_token
    get_current_user = get_user
    require_user = require
    get_guest_token = get_guest

def set_email_config(send_fn):
    global send_order_confirmation_email
    send_order_confirmation_email = send_fn

def set_notification_config(send_fn):
    global send_order_notification_telegram
    send_order_notification_telegram = send_fn

@router.post("/checkout")
async def create_order(data: CheckoutCreate, request: Request):
    user = await get_current_user(request)
    guest_token = get_guest_token(request)
    if user:
        cart = await db.carts.find_one({"user_id": user["user_id"]}, {"_id": 0})
    elif guest_token:
        cart = await db.carts.find_one({"guest_token": guest_token}, {"_id": 0})
    else:
        raise HTTPException(status_code=400, detail="No cart found")
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    items = cart["items"]
    subtotal = sum(i["price"] * i["quantity"] for i in items)
    tax = round(subtotal * 0.18, 2)
    shipping = 0 if subtotal >= 5000 else 500
    
    # Handle coupon discount
    discount = 0
    coupon_code = None
    if data.coupon_code:
        coupon = await db.coupons.find_one({"code": data.coupon_code.upper(), "active": True})
        if coupon:
            valid = True
            if coupon.get("expiry_date"):
                expiry = datetime.fromisoformat(coupon["expiry_date"].replace('Z', '+00:00'))
                if datetime.now(timezone.utc) > expiry:
                    valid = False
            if coupon.get("usage_limit") and coupon.get("times_used", 0) >= coupon["usage_limit"]:
                valid = False
            if (subtotal + tax + shipping) < coupon.get("min_order", 0):
                valid = False
            
            if valid:
                if coupon["discount_type"] == "percentage":
                    discount = ((subtotal + tax + shipping) * coupon["discount_value"]) / 100
                    if coupon.get("max_discount"):
                        discount = min(discount, coupon["max_discount"])
                else:
                    discount = coupon["discount_value"]
                discount = round(discount, 2)
                coupon_code = coupon["code"]
                await db.coupons.update_one(
                    {"code": data.coupon_code.upper()},
                    {"$inc": {"times_used": 1}}
                )
    
    total = round(subtotal + tax + shipping - discount, 2)
    order_number = f"VY-{datetime.now(timezone.utc).strftime('%y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    order = {
        "order_id": f"order_{uuid.uuid4().hex[:12]}",
        "order_number": order_number,
        "user_id": user["user_id"] if user else None,
        "guest_email": data.email,
        "customer_name": data.name,
        "phone": data.phone,
        "items": items,
        "subtotal": subtotal, 
        "tax": tax, 
        "shipping": shipping, 
        "discount": discount,
        "coupon_code": coupon_code,
        "total": total,
        "status": "confirmed", "payment_status": "paid", "payment_method": data.payment_method,
        "shipping_address": {
            "line1": data.address_line1, "line2": data.address_line2,
            "city": data.city, "state": data.state, "pincode": data.pincode
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order)
    order.pop("_id", None)
    if user:
        await db.carts.update_one({"user_id": user["user_id"]}, {"$set": {"items": [], "updated_at": datetime.now(timezone.utc).isoformat()}})
    elif guest_token:
        await db.carts.update_one({"guest_token": guest_token}, {"$set": {"items": [], "updated_at": datetime.now(timezone.utc).isoformat()}})
    
    order['email'] = data.email
    send_order_notification_telegram(order)
    await send_order_confirmation_email(order)
    
    logger.info(f"✓ Order {order_number} created successfully for {data.email}")
    return order

@router.get("/orders")
async def list_orders(request: Request):
    user = await require_user(request)
    orders = await db.orders.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"orders": orders}

@router.get("/orders/{order_id}")
async def get_order(order_id: str, request: Request):
    user = await get_current_user(request)
    query = {"order_id": order_id}
    if user:
        query["user_id"] = user["user_id"]
    order = await db.orders.find_one(query, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.get("/orders/by-number/{order_number}")
async def get_order_by_number(order_number: str):
    """Get order by order number (for order confirmation page)"""
    order = await db.orders.find_one({"order_number": order_number}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.post("/payment/create-order")
async def create_payment_order(request: Request):
    body = await request.json()
    amount = body.get("amount", 0)
    order_id = f"pay_{uuid.uuid4().hex[:16]}"
    return {"order_id": order_id, "amount": amount, "currency": "INR", "status": "created", "mock": True}

@router.post("/payment/verify")
async def verify_payment(request: Request):
    body = await request.json()
    return {"verified": True, "payment_id": body.get("payment_id", f"mock_{uuid.uuid4().hex[:8]}"), "mock": True}
