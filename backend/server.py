from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── Telegram Bot Setup ───────────────────────────────────────────────────────
try:
    import requests
    TELEGRAM_ENABLED = all([
        os.getenv('TELEGRAM_BOT_TOKEN'),
        os.getenv('TELEGRAM_CHAT_ID')
    ]) and os.getenv('TELEGRAM_BOT_TOKEN') != 'your_telegram_bot_token'
    
    if TELEGRAM_ENABLED:
        logger.info("✓ Telegram Bot initialized successfully")
    else:
        logger.warning("⚠ Telegram credentials not configured - notifications will be mocked")
except Exception as e:
    TELEGRAM_ENABLED = False
    logger.warning(f"⚠ Telegram not available: {e}")

# ─── Razorpay Setup ────────────────────────────────────────────────────────────
try:
    import razorpay
    RAZORPAY_ENABLED = all([
        os.getenv('RAZORPAY_KEY_ID'),
        os.getenv('RAZORPAY_KEY_SECRET')
    ]) and os.getenv('RAZORPAY_KEY_ID') != 'your_razorpay_key_id'
    
    if RAZORPAY_ENABLED:
        razorpay_client = razorpay.Client(auth=(
            os.getenv('RAZORPAY_KEY_ID'),
            os.getenv('RAZORPAY_KEY_SECRET')
        ))
        logger.info("✓ Razorpay initialized successfully")
    else:
        logger.warning("⚠ Razorpay credentials not configured - using mock mode")
except Exception as e:
    RAZORPAY_ENABLED = False
    logger.warning(f"⚠ Razorpay not available: {e}")

# ─── Resend Email Setup ────────────────────────────────────────────────────────
try:
    import resend
    RESEND_ENABLED = os.getenv('RESEND_API_KEY') and os.getenv('RESEND_API_KEY') != 'your_resend_api_key'
    
    if RESEND_ENABLED:
        resend.api_key = os.getenv('RESEND_API_KEY')
        SENDER_EMAIL = os.getenv('SENDER_EMAIL', 'onboarding@resend.dev')
        logger.info("✓ Resend email service initialized successfully")
    else:
        logger.warning("⚠ Resend API key not configured - email notifications will be mocked")
except Exception as e:
    RESEND_ENABLED = False
    logger.warning(f"⚠ Resend not available: {e}")

def send_order_notification_telegram(order_data):
    """Send Telegram notification when a new order is placed"""
    try:
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN', 'your_telegram_bot_token')
        chat_id = os.getenv('TELEGRAM_CHAT_ID', 'your_chat_id')
        
        # Format order items
        items_text = ""
        for idx, item in enumerate(order_data['items'], 1):
            items_text += f"\n{idx}. *{item['name']}*"
            items_text += f"\n   Size: {item['size']} | Qty: {item['quantity']} | Price: ₹{item['price']:,}"
        
        # Format delivery address
        addr = order_data['shipping_address']
        address_text = f"{addr['line1']}"
        if addr.get('line2'):
            address_text += f", {addr['line2']}"
        address_text += f"\n{addr['city']}, {addr['state']} - {addr['pincode']}"
        
        # Create formatted Telegram message
        message = f"""🛍️ *NEW ORDER RECEIVED*

📋 *Order:* `{order_data['order_number']}`

👤 *Customer Details:*
Name: {order_data['customer_name']}
Phone: {order_data['phone']}

📦 *Items Ordered:*{items_text}

💰 *Payment Summary:*
Subtotal: ₹{order_data['subtotal']:,}
Tax (18%): ₹{order_data['tax']:,}
Shipping: ₹{order_data['shipping']:,}
*TOTAL: ₹{order_data['total']:,}*
Payment: {order_data['payment_method'].upper()}

📍 *Delivery Address:*
{address_text}

✅ Status: {order_data['status'].upper()}
💳 Payment: {order_data['payment_status'].upper()}"""
        
        if TELEGRAM_ENABLED:
            url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            payload = {
                "chat_id": chat_id,
                "text": message,
                "parse_mode": "Markdown"
            }
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                logger.info(f"✓ Telegram notification sent successfully to chat {chat_id}")
                return True
            else:
                logger.error(f"✗ Telegram API error: {response.status_code} - {response.text}")
                return False
        else:
            logger.info(f"[MOCK TELEGRAM] Would send to chat {chat_id}:")
            logger.info(message)
            return False
            
    except Exception as e:
        logger.error(f"✗ Failed to send Telegram notification: {e}")
        return False

async def send_order_confirmation_email(order_data):
    """Send order confirmation email to customer"""
    try:
        # Format order items for email
        items_html = ""
        for item in order_data['items']:
            items_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <strong>{item['name']}</strong><br/>
                    <span style="color: #666; font-size: 14px;">Size: {item['size']} | Qty: {item['quantity']}</span>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹{item['price']:,}</td>
            </tr>
            """
        
        # Format delivery address
        addr = order_data['shipping_address']
        address_html = f"""
        {order_data['customer_name']}<br/>
        {addr['line1']}<br/>
        {addr['line2'] + '<br/>' if addr.get('line2') else ''}
        {addr['city']}, {addr['state']} - {addr['pincode']}<br/>
        Phone: {order_data['phone']}
        """
        
        # Create HTML email
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                            <!-- Header -->
                            <tr>
                                <td style="background-color: #1a1a1a; padding: 30px; text-align: center;">
                                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; letter-spacing: 4px; font-weight: 300;">ANGARAKHA</h1>
                                </td>
                            </tr>
                            
                            <!-- Success Message -->
                            <tr>
                                <td style="padding: 40px 30px 20px; text-align: center;">
                                    <div style="display: inline-block; width: 60px; height: 60px; background-color: #22c55e; border-radius: 50%; line-height: 60px;">
                                        <span style="color: white; font-size: 30px;">✓</span>
                                    </div>
                                    <h2 style="margin: 20px 0 10px; color: #1a1a1a; font-size: 24px;">Order Confirmed!</h2>
                                    <p style="margin: 0; color: #666; font-size: 16px;">Thank you for your purchase</p>
                                </td>
                            </tr>
                            
                            <!-- Order Number -->
                            <tr>
                                <td style="padding: 0 30px 30px; text-align: center;">
                                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; display: inline-block;">
                                        <p style="margin: 0 0 5px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
                                        <p style="margin: 0; color: #1a1a1a; font-size: 20px; font-family: monospace; font-weight: bold;">{order_data['order_number']}</p>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Order Items -->
                            <tr>
                                <td style="padding: 0 30px 20px;">
                                    <h3 style="margin: 0 0 15px; color: #1a1a1a; font-size: 18px;">Order Items</h3>
                                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #eee;">
                                        {items_html}
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Order Summary -->
                            <tr>
                                <td style="padding: 0 30px 20px;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="padding: 5px 0; color: #666;">Subtotal</td>
                                            <td style="padding: 5px 0; text-align: right;">₹{order_data['subtotal']:,}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 5px 0; color: #666;">Tax (18%)</td>
                                            <td style="padding: 5px 0; text-align: right;">₹{order_data['tax']:,}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 5px 0; color: #666;">Shipping</td>
                                            <td style="padding: 5px 0; text-align: right;">₹{order_data['shipping']:,}</td>
                                        </tr>
                                        <tr style="border-top: 2px solid #1a1a1a;">
                                            <td style="padding: 10px 0 0; font-weight: bold; font-size: 18px;">Total</td>
                                            <td style="padding: 10px 0 0; text-align: right; font-weight: bold; font-size: 18px; color: #1a1a1a;">₹{order_data['total']:,}</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Delivery Address -->
                            <tr>
                                <td style="padding: 20px 30px; background-color: #f9f9f9;">
                                    <h3 style="margin: 0 0 10px; color: #1a1a1a; font-size: 16px;">Delivery Address</h3>
                                    <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">
                                        {address_html}
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Payment Info -->
                            <tr>
                                <td style="padding: 20px 30px;">
                                    <h3 style="margin: 0 0 10px; color: #1a1a1a; font-size: 16px;">Payment Information</h3>
                                    <p style="margin: 0 0 5px; color: #666; font-size: 14px;">Payment Method: <strong>{order_data['payment_method'].upper()}</strong></p>
                                    <p style="margin: 0 0 5px; color: #666; font-size: 14px;">Payment Status: <strong style="color: #22c55e;">{order_data['payment_status'].upper()}</strong></p>
                                    <p style="margin: 0; color: #666; font-size: 14px;">Order Status: <strong>{order_data['status'].upper()}</strong></p>
                                </td>
                            </tr>
                            
                            <!-- What's Next -->
                            <tr>
                                <td style="padding: 20px 30px; background-color: #f9f9f9;">
                                    <h3 style="margin: 0 0 10px; color: #1a1a1a; font-size: 16px;">What's Next?</h3>
                                    <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px; line-height: 1.8;">
                                        <li>We'll send you tracking details once your order is shipped</li>
                                        <li>Expected delivery: 5-7 business days</li>
                                        <li>Questions? Contact us at +91 98285 41068</li>
                                    </ul>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="padding: 30px; text-align: center; background-color: #1a1a1a;">
                                    <p style="margin: 0 0 10px; color: #ffffff; font-size: 24px; letter-spacing: 3px; font-weight: 300;">ANGARAKHA</p>
                                    <p style="margin: 0; color: #999; font-size: 12px;">
                                        Building No. 11, Ghee Walo Ka Rasta, Johri Bazar, Jaipur-302001<br/>
                                        Phone: +91 98285 41068 | Daily: 10:30 AM - 9:30 PM
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        if RESEND_ENABLED:
            params = {
                "from": SENDER_EMAIL,
                "to": [order_data['email']],
                "subject": f"Order Confirmation - {order_data['order_number']} | Angarakha",
                "html": html_content
            }
            
            # Run sync SDK in thread to keep FastAPI non-blocking
            email_result = await asyncio.to_thread(resend.Emails.send, params)
            logger.info(f"✓ Order confirmation email sent to {order_data['email']} - ID: {email_result.get('id')}")
            return True
        else:
            logger.info(f"[MOCK EMAIL] Would send order confirmation to {order_data['email']}")
            return False
            
    except Exception as e:
        logger.error(f"✗ Failed to send order confirmation email: {e}")
        return False


# ─── Pydantic Models ───────────────────────────────────────────────────────────

class EnquiryCreate(BaseModel):
    name: str
    email: Optional[str] = ""
    phone: str
    occasion: Optional[str] = ""
    preferred_date: Optional[str] = ""
    message: str

class NewsletterCreate(BaseModel):
    email: str

class CartItemAdd(BaseModel):
    product_id: str
    product_slug: str
    name: str
    image: str
    size: str
    color: Optional[str] = ""
    price: float
    quantity: int = 1


class CouponCreate(BaseModel):
    code: str
    discount_type: str  # 'percentage' or 'fixed'
    discount_value: float
    min_order: float = 0
    max_discount: Optional[float] = None
    expiry_date: Optional[str] = None
    usage_limit: Optional[int] = None
    active: bool = True

class CouponValidate(BaseModel):
    code: str
    order_total: float

class CartItemUpdate(BaseModel):
    quantity: int

class CheckoutCreate(BaseModel):
    email: str
    name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = ""
    city: str
    state: str
    pincode: str
    payment_method: str = "upi"
    coupon_code: Optional[str] = None

class ReviewCreate(BaseModel):
    rating: int
    title: str
    body: str
    fit_feedback: Optional[str] = ""

# ─── Auth Helpers ──────────────────────────────────────────────────────────────

async def get_current_user(request: Request):
    token = request.cookies.get("session_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        return None
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        return None
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        from datetime import datetime as dt
        expires_at = dt.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    return user

async def require_user(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

def get_guest_token(request: Request):
    return request.headers.get("X-Guest-Token", "")

# ─── Auth Routes ───────────────────────────────────────────────────────────────

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    async with httpx.AsyncClient() as http_client:
        resp = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    data = resp.json()
    email = data["email"]
    name = data.get("name", "")
    picture = data.get("picture", "")
    session_token = data["session_token"]
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"email": email}, {"$set": {"name": name, "picture": picture}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": name, "picture": picture,
            "phone": "", "addresses": [], "created_at": datetime.now(timezone.utc)
        })
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": datetime.now(timezone.utc).replace(day=datetime.now(timezone.utc).day) + __import__('datetime').timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7*24*60*60)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_many({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"status": "ok"}

# ─── Product Routes ────────────────────────────────────────────────────────────

@api_router.get("/products")
async def list_products(
    occasion: Optional[str] = None, category: Optional[str] = None,
    color: Optional[str] = None, fabric: Optional[str] = None,
    size: Optional[str] = None, min_price: Optional[float] = None,
    max_price: Optional[float] = None, sort: Optional[str] = "featured",
    page: int = 1, limit: int = 12
):
    query = {"in_stock": True}
    if occasion:
        query["occasions"] = {"$in": [occasion]}
    if category:
        query["category"] = category
    if color:
        query["color"] = {"$regex": color, "$options": "i"}
    if fabric:
        query["fabric"] = {"$regex": fabric, "$options": "i"}
    if size:
        query["sizes"] = {"$in": [size]}
    if min_price is not None:
        query["price"] = query.get("price", {})
        query["price"]["$gte"] = min_price
    if max_price is not None:
        query["price"] = query.get("price", {})
        query["price"]["$lte"] = max_price
    sort_field = [("price", 1)]
    if sort == "price_desc":
        sort_field = [("price", -1)]
    elif sort == "price_asc":
        sort_field = [("price", 1)]
    elif sort == "newest":
        sort_field = [("created_at", -1)]
    elif sort == "featured":
        sort_field = [("featured", -1), ("created_at", -1)]
    skip = (page - 1) * limit
    total = await db.products.count_documents(query)
    products = await db.products.find(query, {"_id": 0}).sort(sort_field).skip(skip).limit(limit).to_list(limit)
    return {"products": products, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.get("/products/{slug}")
async def get_product(slug: str):
    product = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

# ─── Collection Routes ─────────────────────────────────────────────────────────

@api_router.get("/collections")
async def list_collections():
    collections = await db.collections.find({}, {"_id": 0}).sort("sort_order", 1).to_list(20)
    return {"collections": collections}

@api_router.get("/collections/{slug}")
async def get_collection(slug: str, sort: Optional[str] = "featured", page: int = 1, limit: int = 12):
    collection = await db.collections.find_one({"slug": slug}, {"_id": 0})
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    query = {"in_stock": True}
    if slug == "all":
        pass
    elif slug == "new-arrivals":
        query["tags"] = {"$in": ["new"]}
    else:
        # Match by occasion tag OR by category (e.g. "sherwanis" → category "sherwani")
        category_map = {"sherwanis": "sherwani", "kurtas": "kurta", "bandhgalas": "bandhgala", "jodhpuris": "jodhpuri", "nehru-jackets": "nehru_jacket"}
        cat = category_map.get(slug)
        if cat:
            query["$or"] = [{"occasions": {"$in": [slug]}}, {"category": cat}]
        else:
            query["occasions"] = {"$in": [slug]}
    sort_field = [("featured", -1), ("created_at", -1)]
    if sort == "price_asc":
        sort_field = [("price", 1)]
    elif sort == "price_desc":
        sort_field = [("price", -1)]
    skip = (page - 1) * limit
    total = await db.products.count_documents(query)
    products = await db.products.find(query, {"_id": 0}).sort(sort_field).skip(skip).limit(limit).to_list(limit)
    return {**collection, "products": products, "total": total, "page": page, "pages": max(1, (total + limit - 1) // limit)}

# ─── Cart Routes ───────────────────────────────────────────────────────────────

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

@api_router.get("/cart")
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

@api_router.post("/cart/items")
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

@api_router.put("/cart/items/{item_id}")
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

@api_router.delete("/cart/items/{item_id}")
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

@api_router.post("/cart/merge")
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

# ─── Checkout & Order Routes ──────────────────────────────────────────────────

@api_router.post("/checkout")
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
            # Validate coupon (same logic as validate endpoint)
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
                # Increment usage count
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
    
    # Add email to order data for notifications
    order['email'] = data.email
    
    # Send Telegram notification
    send_order_notification_telegram(order)
    
    # Send order confirmation email
    await send_order_confirmation_email(order)
    
    logger.info(f"✓ Order {order_number} created successfully for {data.email}")
    return order

@api_router.get("/orders")
async def list_orders(request: Request):
    user = await require_user(request)
    orders = await db.orders.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"orders": orders}

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, request: Request):
    user = await get_current_user(request)
    query = {"order_id": order_id}
    if user:
        query["user_id"] = user["user_id"]
    order = await db.orders.find_one(query, {"_id": 0})

@api_router.get("/orders/by-number/{order_number}")
async def get_order_by_number(order_number: str):
    """Get order by order number (for order confirmation page)"""
    order = await db.orders.find_one({"order_number": order_number}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

# ─── Enquiry & Newsletter ─────────────────────────────────────────────────────

@api_router.post("/enquiry")
async def submit_enquiry(data: EnquiryCreate):
    enquiry = {
        "enquiry_id": f"enq_{uuid.uuid4().hex[:10]}",
        **data.model_dump(),
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.enquiries.insert_one(enquiry)
    enquiry.pop("_id", None)
    logger.info(f"[MOCK EMAIL] Enquiry notification for {data.name} ({data.email})")
    return {"status": "submitted", "enquiry_id": enquiry["enquiry_id"]}

@api_router.post("/newsletter")
async def subscribe_newsletter(data: NewsletterCreate):
    existing = await db.newsletter.find_one({"email": data.email})
    if existing:
        return {"status": "already_subscribed"}
    await db.newsletter.insert_one({"email": data.email, "subscribed_at": datetime.now(timezone.utc).isoformat()})
    logger.info(f"[MOCK EMAIL] Newsletter welcome to {data.email}")
    return {"status": "subscribed"}

# ─── Reviews ───────────────────────────────────────────────────────────────────

@api_router.get("/reviews/{product_slug}")
async def get_reviews(product_slug: str):
    reviews = await db.reviews.find({"product_slug": product_slug}, {"_id": 0}).sort("created_at", -1).to_list(50)
    if reviews:
        avg = sum(r["rating"] for r in reviews) / len(reviews)
    else:
        avg = 0
    return {"reviews": reviews, "average_rating": round(avg, 1), "total": len(reviews)}

@api_router.post("/reviews/{product_slug}")
async def create_review(product_slug: str, data: ReviewCreate, request: Request):
    user = await require_user(request)
    review = {
        "review_id": f"rev_{uuid.uuid4().hex[:10]}",
        "product_slug": product_slug,
        "user_id": user["user_id"],
        "user_name": user.get("name", "Anonymous"),
        "rating": data.rating, "title": data.title, "body": data.body,
        "fit_feedback": data.fit_feedback,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reviews.insert_one(review)
    review.pop("_id", None)
    return review

# ─── Search ────────────────────────────────────────────────────────────────────

@api_router.get("/search")
async def search_products(q: str = "", occasion: Optional[str] = None, category: Optional[str] = None, sort: Optional[str] = "featured", page: int = 1, limit: int = 12):
    query = {"in_stock": True}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"tags": {"$in": [q.lower()]}},
            {"category": {"$regex": q, "$options": "i"}},
            {"fabric": {"$regex": q, "$options": "i"}}
        ]
    if occasion:
        query["occasions"] = {"$in": [occasion]}
    if category:
        query["category"] = category
    sort_field = [("created_at", -1)]
    if sort == "price_asc": sort_field = [("price", 1)]
    elif sort == "price_desc": sort_field = [("price", -1)]
    elif sort == "newest": sort_field = [("created_at", -1)]
    skip = (page - 1) * limit
    total = await db.products.count_documents(query)
    products = await db.products.find(query, {"_id": 0}).sort(sort_field).skip(skip).limit(limit).to_list(limit)
    return {"products": products, "total": total, "page": page, "pages": max(1, (total + limit - 1) // limit)}

# ─── Mock Payment ──────────────────────────────────────────────────────────────

@api_router.post("/payment/create-order")
async def create_payment_order(request: Request):
    body = await request.json()
    amount = body.get("amount", 0)
    order_id = f"pay_{uuid.uuid4().hex[:16]}"
    return {"order_id": order_id, "amount": amount, "currency": "INR", "status": "created", "mock": True}

@api_router.post("/payment/verify")
async def verify_payment(request: Request):
    body = await request.json()
    return {"verified": True, "payment_id": body.get("payment_id", f"mock_{uuid.uuid4().hex[:8]}"), "mock": True}

# ─── CMS ───────────────────────────────────────────────────────────────────────

@api_router.get("/cms/{key}")
async def get_cms(key: str):
    block = await db.cms.find_one({"key": key}, {"_id": 0})
    if not block:
        raise HTTPException(status_code=404, detail="CMS block not found")
    return block

# ─── Admin Helpers ─────────────────────────────────────────────────────────────

async def require_admin(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

@api_router.post("/admin/setup")
async def admin_setup(request: Request):
    """Make the current user an admin if no admin exists yet."""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    existing_admin = await db.users.find_one({"is_admin": True}, {"_id": 0})
    if existing_admin:
        if existing_admin["user_id"] == user["user_id"]:
            return {"status": "already_admin"}
        raise HTTPException(status_code=403, detail="Admin already exists")
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"is_admin": True}})
    return {"status": "admin_granted"}

# ─── Admin Analytics ───────────────────────────────────────────────────────────

@api_router.get("/admin/analytics")
async def admin_analytics(request: Request):
    await require_admin(request)
    total_orders = await db.orders.count_documents({})
    total_customers = await db.users.count_documents({})
    total_products = await db.products.count_documents({})
    total_enquiries = await db.enquiries.count_documents({})
    total_subscribers = await db.newsletter.count_documents({})

    # Revenue & order stats
    orders = await db.orders.find({}, {"_id": 0, "total": 1, "status": 1, "payment_status": 1, "created_at": 1, "items": 1}).to_list(1000)
    total_revenue = sum(o.get("total", 0) for o in orders)
    avg_order_value = round(total_revenue / total_orders, 2) if total_orders else 0

    status_counts = {}
    for o in orders:
        s = o.get("status", "unknown")
        status_counts[s] = status_counts.get(s, 0) + 1

    # Monthly revenue (last 6 months)
    from collections import defaultdict
    monthly = defaultdict(float)
    for o in orders:
        ca = o.get("created_at", "")
        if ca:
            month_key = ca[:7] if isinstance(ca, str) else ca.strftime("%Y-%m")
            monthly[month_key] += o.get("total", 0)
    monthly_data = [{"month": k, "revenue": round(v)} for k, v in sorted(monthly.items())[-6:]]

    # Top products by order frequency
    product_counts = defaultdict(lambda: {"count": 0, "revenue": 0, "name": ""})
    for o in orders:
        for item in o.get("items", []):
            pid = item.get("product_id", "")
            product_counts[pid]["count"] += item.get("quantity", 0)
            product_counts[pid]["revenue"] += item.get("price", 0) * item.get("quantity", 0)
            product_counts[pid]["name"] = item.get("name", "")
    top_products = sorted(product_counts.values(), key=lambda x: x["revenue"], reverse=True)[:5]

    # Recent orders
    recent = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)

    return {
        "total_revenue": round(total_revenue, 2), "total_orders": total_orders,
        "avg_order_value": avg_order_value, "total_customers": total_customers,
        "total_products": total_products, "total_enquiries": total_enquiries,
        "total_subscribers": total_subscribers,
        "order_status": status_counts, "monthly_revenue": monthly_data,
        "top_products": top_products, "recent_orders": recent
    }

# ─── Admin Products ────────────────────────────────────────────────────────────

@api_router.get("/admin/products")
async def admin_list_products(request: Request, q: str = "", page: int = 1, limit: int = 20):
    await require_admin(request)
    query = {}
    if q:
        query["$or"] = [{"name": {"$regex": q, "$options": "i"}}, {"category": {"$regex": q, "$options": "i"}}]
    total = await db.products.count_documents(query)
    products = await db.products.find(query, {"_id": 0}).sort("created_at", -1).skip((page-1)*limit).limit(limit).to_list(limit)
    return {"products": products, "total": total, "page": page, "pages": max(1, (total+limit-1)//limit)}

@api_router.post("/admin/products")
async def admin_create_product(request: Request):
    await require_admin(request)
    body = await request.json()
    slug = body.get("slug", "")
    if not slug:
        slug = body.get("name", "").lower().replace(" ", "-").replace("'", "")
        import re
        slug = re.sub(r'[^a-z0-9\-]', '', slug)
    existing = await db.products.find_one({"slug": slug})
    if existing:
        slug = f"{slug}-{uuid.uuid4().hex[:4]}"
    product = {
        "product_id": f"prod_{uuid.uuid4().hex[:8]}",
        "name": body.get("name", ""), "slug": slug,
        "short_description": body.get("short_description", ""),
        "description": body.get("description", ""),
        "price": body.get("price", 0), "compare_price": body.get("compare_price", 0),
        "images": body.get("images", []),
        "category": body.get("category", "kurta"),
        "fabric": body.get("fabric", ""), "color": body.get("color", ""), "fit": body.get("fit", "Regular"),
        "occasions": body.get("occasions", []), "sizes": body.get("sizes", []),
        "tags": body.get("tags", []),
        "in_stock": body.get("in_stock", True), "featured": body.get("featured", False),
        "care": body.get("care", ""), "lining": body.get("lining", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.insert_one(product)
    product.pop("_id", None)
    return product

@api_router.put("/admin/products/{product_id}")
async def admin_update_product(product_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    body.pop("_id", None)
    body.pop("product_id", None)
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.products.update_one({"product_id": product_id}, {"$set": body})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    return product

@api_router.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str, request: Request):
    await require_admin(request)
    result = await db.products.delete_one({"product_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"status": "deleted"}

# ─── Admin Orders ──────────────────────────────────────────────────────────────

@api_router.get("/admin/orders")
async def admin_list_orders(request: Request, status: str = "", page: int = 1, limit: int = 20):
    await require_admin(request)
    query = {}
    if status:
        query["status"] = status
    total = await db.orders.count_documents(query)
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip((page-1)*limit).limit(limit).to_list(limit)
    return {"orders": orders, "total": total, "page": page, "pages": max(1, (total+limit-1)//limit)}

@api_router.put("/admin/orders/{order_id}")
async def admin_update_order(order_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    update_fields = {}
    if "status" in body:
        update_fields["status"] = body["status"]
    if "payment_status" in body:
        update_fields["payment_status"] = body["payment_status"]
    if "tracking_number" in body:
        update_fields["tracking_number"] = body["tracking_number"]
    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.orders.update_one({"order_id": order_id}, {"$set": update_fields})
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    return order

# ─── Admin Collections ─────────────────────────────────────────────────────────

@api_router.get("/admin/collections")
async def admin_list_collections(request: Request):
    await require_admin(request)
    collections = await db.collections.find({}, {"_id": 0}).sort("sort_order", 1).to_list(50)
    return {"collections": collections}

@api_router.post("/admin/collections")
async def admin_create_collection(request: Request):
    await require_admin(request)
    body = await request.json()
    collection = {
        "collection_id": f"col_{uuid.uuid4().hex[:6]}",
        "name": body.get("name", ""), "slug": body.get("slug", body.get("name", "").lower().replace(" ", "-")),
        "description": body.get("description", ""),
        "hero_image": body.get("hero_image", ""),
        "occasion_tags": body.get("occasion_tags", []),
        "featured": body.get("featured", False),
        "sort_order": body.get("sort_order", 99)
    }
    await db.collections.insert_one(collection)
    collection.pop("_id", None)
    return collection


# ─── Coupons (Admin) ───────────────────────────────────────────────────────────

@api_router.get("/admin/coupons")
async def admin_list_coupons(request: Request):
    """Get all coupons for admin panel"""
    await require_admin(request)
    coupons = await db.coupons.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"coupons": coupons}

@api_router.post("/admin/coupons")
async def admin_create_coupon(data: CouponCreate, request: Request):
    """Create a new coupon"""
    await require_admin(request)
    
    # Check if coupon code already exists
    existing = await db.coupons.find_one({"code": data.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    coupon = {
        "coupon_id": str(uuid.uuid4()),
        "code": data.code.upper(),
        "discount_type": data.discount_type,
        "discount_value": data.discount_value,
        "min_order": data.min_order,
        "max_discount": data.max_discount,
        "expiry_date": data.expiry_date,
        "usage_limit": data.usage_limit,
        "times_used": 0,
        "active": data.active,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.coupons.insert_one(coupon)
    coupon.pop("_id", None)
    logger.info(f"Coupon created: {data.code}")
    return coupon

@api_router.delete("/admin/coupons/{coupon_id}")
async def admin_delete_coupon(coupon_id: str, request: Request):
    """Delete a coupon"""
    await require_admin(request)
    result = await db.coupons.delete_one({"coupon_id": coupon_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return {"message": "Coupon deleted"}

@api_router.put("/admin/coupons/{coupon_id}")
async def admin_update_coupon(coupon_id: str, data: CouponCreate, request: Request):
    """Update a coupon"""
    await require_admin(request)
    
    update_data = {
        "code": data.code.upper(),
        "discount_type": data.discount_type,
        "discount_value": data.discount_value,
        "min_order": data.min_order,
        "max_discount": data.max_discount,
        "expiry_date": data.expiry_date,
        "usage_limit": data.usage_limit,
        "active": data.active,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.coupons.update_one({"coupon_id": coupon_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    coupon = await db.coupons.find_one({"coupon_id": coupon_id}, {"_id": 0})
    return coupon

# ─── Coupon Validation (Public) ────────────────────────────────────────────────

@api_router.post("/coupons/validate")
async def validate_coupon(data: CouponValidate):
    """Validate a coupon code and return discount amount"""
    coupon = await db.coupons.find_one({"code": data.code.upper(), "active": True})
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    # Check expiry
    if coupon.get("expiry_date"):
        from datetime import datetime
        expiry = datetime.fromisoformat(coupon["expiry_date"].replace('Z', '+00:00'))
        if datetime.now(timezone.utc) > expiry:
            raise HTTPException(status_code=400, detail="Coupon has expired")
    
    # Check usage limit
    if coupon.get("usage_limit") and coupon.get("times_used", 0) >= coupon["usage_limit"]:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")
    
    # Check minimum order value
    if data.order_total < coupon.get("min_order", 0):
        raise HTTPException(
            status_code=400, 
            detail=f"Minimum order value of ₹{coupon['min_order']} required"
        )
    
    # Calculate discount
    if coupon["discount_type"] == "percentage":
        discount = (data.order_total * coupon["discount_value"]) / 100
        if coupon.get("max_discount"):
            discount = min(discount, coupon["max_discount"])
    else:  # fixed
        discount = coupon["discount_value"]
    
    return {
        "valid": True,
        "code": coupon["code"],
        "discount_type": coupon["discount_type"],
        "discount_value": coupon["discount_value"],
        "discount_amount": round(discount, 2),
        "message": f"Coupon applied! You saved ₹{round(discount, 2)}"
    }

@api_router.put("/admin/collections/{collection_id}")
async def admin_update_collection(collection_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    body.pop("_id", None)
    body.pop("collection_id", None)
    await db.collections.update_one({"collection_id": collection_id}, {"$set": body})
    col = await db.collections.find_one({"collection_id": collection_id}, {"_id": 0})
    return col

@api_router.delete("/admin/collections/{collection_id}")
async def admin_delete_collection(collection_id: str, request: Request):
    await require_admin(request)
    await db.collections.delete_one({"collection_id": collection_id})
    return {"status": "deleted"}

# ─── Admin Enquiries ───────────────────────────────────────────────────────────

@api_router.get("/admin/enquiries")
async def admin_list_enquiries(request: Request, page: int = 1, limit: int = 20):
    await require_admin(request)
    total = await db.enquiries.count_documents({})
    enquiries = await db.enquiries.find({}, {"_id": 0}).sort("created_at", -1).skip((page-1)*limit).limit(limit).to_list(limit)
    return {"enquiries": enquiries, "total": total}

@api_router.put("/admin/enquiries/{enquiry_id}")
async def admin_update_enquiry(enquiry_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    await db.enquiries.update_one({"enquiry_id": enquiry_id}, {"$set": {"status": body.get("status", "reviewed")}})
    return {"status": "updated"}

# ─── Admin CMS ─────────────────────────────────────────────────────────────────

@api_router.get("/admin/cms")
async def admin_list_cms(request: Request):
    await require_admin(request)
    blocks = await db.cms.find({}, {"_id": 0}).to_list(50)
    return {"blocks": blocks}

@api_router.put("/admin/cms/{key}")
async def admin_update_cms(key: str, request: Request):
    await require_admin(request)
    body = await request.json()
    body.pop("_id", None)
    await db.cms.update_one({"key": key}, {"$set": body}, upsert=True)
    block = await db.cms.find_one({"key": key}, {"_id": 0})
    return block

# ─── Admin Customers & Newsletter ──────────────────────────────────────────────

@api_router.get("/admin/customers")
async def admin_list_customers(request: Request, page: int = 1, limit: int = 20):
    await require_admin(request)
    total = await db.users.count_documents({})
    customers = await db.users.find({}, {"_id": 0}).sort("created_at", -1).skip((page-1)*limit).limit(limit).to_list(limit)
    return {"customers": customers, "total": total}

@api_router.get("/admin/newsletter")
async def admin_list_newsletter(request: Request):
    await require_admin(request)
    subs = await db.newsletter.find({}, {"_id": 0}).sort("subscribed_at", -1).to_list(500)
    return {"subscribers": subs, "total": len(subs)}

# ─── Seed Data ─────────────────────────────────────────────────────────────────

IMG_HERO = "https://images.pexels.com/photos/6687174/pexels-photo-6687174.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1080&w=1920"
IMG_SHERWANI1 = "https://images.pexels.com/photos/6458310/pexels-photo-6458310.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=500"
IMG_SHERWANI2 = "https://images.pexels.com/photos/6687174/pexels-photo-6687174.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=500"
IMG_WEDDING = "https://images.unsplash.com/photo-1762709413447-15781dbc08f7?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"
IMG_KURTA1 = "https://images.unsplash.com/photo-1767775498862-d4740ce574ce?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"
IMG_FESTIVE = "https://images.unsplash.com/photo-1774267230662-575d1f4ec1bd?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"
IMG_ARCH = "https://images.unsplash.com/photo-1524227489942-c14a3dc8422c?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
IMG_TEXTURE = "https://images.unsplash.com/photo-1683140426885-6c0ce899409c?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
IMG_GOLD = "https://images.pexels.com/photos/2248589/pexels-photo-2248589.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"

SEED_PRODUCTS = [
    {
        "product_id": "prod_001", "name": "Royal Ivory Sherwani", "slug": "royal-ivory-sherwani",
        "short_description": "Hand-embroidered ivory sherwani with antique zardozi work",
        "description": "A masterpiece of ceremonial dressing. This ivory sherwani features intricate zardozi embroidery on the collar, sleeves and hem. Crafted from premium raw silk with a satin lining for all-day comfort. Paired best with churidar or dhoti for a regal wedding look.",
        "price": 45000, "compare_price": 52000, "images": [IMG_SHERWANI1, IMG_SHERWANI2, IMG_GOLD],
        "category": "sherwani", "fabric": "Raw Silk", "color": "Ivory", "fit": "Tailored",
        "occasions": ["wedding"], "sizes": ["S", "M", "L", "XL", "XXL"],
        "tags": ["wedding", "sherwani", "bestseller", "new"], "in_stock": True, "featured": True,
        "care": "Dry clean only. Store in garment bag.", "lining": "Satin",
        "size_stock": {"S": 5, "M": 8, "L": 10, "XL": 6, "XXL": 3},
        "badges": ["bestseller", "new"],
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "product_id": "prod_002", "name": "Midnight Indigo Sherwani", "slug": "midnight-indigo-sherwani",
        "short_description": "Deep indigo sherwani with subtle thread work and velvet trim",
        "description": "A contemporary take on the classic sherwani. Deep indigo dupion silk body with velvet lapels and hand-stitched thread work along the placket. The slim silhouette and mandarin collar lend a modern edge while honouring traditional craftsmanship.",
        "price": 38000, "compare_price": 44000, "images": [IMG_SHERWANI2, IMG_SHERWANI1, IMG_TEXTURE],
        "category": "sherwani", "fabric": "Dupion Silk", "color": "Indigo", "fit": "Slim",
        "occasions": ["wedding", "festive"], "sizes": ["S", "M", "L", "XL"],
        "tags": ["wedding", "sherwani", "new"], "in_stock": True, "featured": True,
        "size_stock": {"S": 3, "M": 7, "L": 6, "XL": 4},
        "badges": ["new"],
        "care": "Dry clean only. Store away from direct sunlight.",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "product_id": "prod_003", "name": "Champagne Zari Sherwani", "slug": "champagne-zari-sherwani",
        "short_description": "Champagne gold sherwani with all-over Banarasi zari weave",
        "description": "Woven by master artisans of Banaras, this champagne sherwani showcases an all-over zari brocade pattern. The structured silhouette with padded shoulders creates a commanding presence. Includes matching stole.",
        "price": 52000, "compare_price": 62000, "images": [IMG_GOLD, IMG_SHERWANI1, IMG_WEDDING],
        "category": "sherwani", "fabric": "Banarasi Brocade", "color": "Gold", "fit": "Regular",
        "occasions": ["wedding"], "sizes": ["M", "L", "XL", "XXL"],
        "tags": ["wedding", "sherwani", "premium"], "in_stock": True, "featured": True,
        "size_stock": {"M": 4, "L": 5, "XL": 3, "XXL": 2},
        "badges": ["bestseller"],
        "care": "Dry clean only. Keep in muslin cover. Avoid folding on zari work.",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "product_id": "prod_004", "name": "Chanderi Silk Kurta", "slug": "chanderi-silk-kurta",
        "short_description": "Lightweight Chanderi silk kurta with delicate butti pattern",
        "description": "The Chanderi silk kurta is a celebration of India's weaving heritage. Lightweight and breathable, the fabric features a subtle butti pattern woven into the silk. Perfect for festive gatherings and sangeet evenings.",
        "price": 12500, "compare_price": 15000, "images": [IMG_KURTA1, IMG_FESTIVE, IMG_TEXTURE],
        "category": "kurta", "fabric": "Chanderi Silk", "color": "Powder Blue", "fit": "Relaxed",
        "occasions": ["festive", "casual"], "sizes": ["S", "M", "L", "XL", "XXL"],
        "tags": ["festive", "kurta", "new"], "in_stock": True, "featured": True,
        "size_stock": {"S": 8, "M": 12, "L": 10, "XL": 6, "XXL": 4},
        "badges": ["new"],
        "care": "Gentle hand wash in cold water or dry clean. Air dry in shade.",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "product_id": "prod_005", "name": "Handloom Cotton Kurta", "slug": "handloom-cotton-kurta",
        "short_description": "Organic handloom cotton kurta for everyday elegance",
        "description": "Woven on traditional pit looms in Rajasthan, this cotton kurta brings artisanal character to daily wear. The natural texture and breathability make it ideal for warm Jaipur days and relaxed festive brunches.",
        "price": 6800, "compare_price": 8500, "images": [IMG_FESTIVE, IMG_KURTA1, IMG_ARCH],
        "category": "kurta", "fabric": "Handloom Cotton", "color": "Ecru", "fit": "Relaxed",
        "occasions": ["casual"], "sizes": ["S", "M", "L", "XL", "XXL"],
        "tags": ["casual", "kurta", "everyday"], "in_stock": True, "featured": False,
        "size_stock": {"S": 10, "M": 15, "L": 12, "XL": 8, "XXL": 5},
        "badges": [],
        "care": "Machine washable. Gentle cycle with similar colours.",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "product_id": "prod_006", "name": "Banarasi Brocade Kurta Set", "slug": "banarasi-brocade-kurta-set",
        "short_description": "Complete festive set with Banarasi kurta, churidar and dupatta",
        "description": "A head-to-toe festive ensemble. The kurta features rich Banarasi brocade with gold thread work, paired with a matching churidar and woven dupatta. Designed for Diwali celebrations, pujas and family gatherings.",
        "price": 18500, "compare_price": 22000, "images": [IMG_GOLD, IMG_FESTIVE, IMG_SHERWANI1],
        "category": "kurta", "fabric": "Banarasi Silk", "color": "Burgundy", "fit": "Regular",
        "occasions": ["festive", "wedding"], "sizes": ["S", "M", "L", "XL"],
        "tags": ["festive", "kurta", "set", "new"], "in_stock": True, "featured": True,
        "size_stock": {"S": 5, "M": 8, "L": 7, "XL": 4},
        "badges": ["new"],
        "care": "Dry clean recommended. Store flat to preserve brocade.",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "product_id": "prod_007", "name": "Classic Black Bandhgala", "slug": "classic-black-bandhgala",
        "short_description": "Timeless black bandhgala suit in Italian wool blend",
        "description": "The quintessential gentleman's garment. This bandhgala is cut from a premium Italian wool blend with a satin-lined interior. The structured shoulders and high collar create a sharp, distinguished silhouette suited for receptions, awards and formal dinners.",
        "price": 28000, "compare_price": 34000, "images": [IMG_SHERWANI2, IMG_TEXTURE, IMG_SHERWANI1],
        "category": "bandhgala", "fabric": "Wool Blend", "color": "Black", "fit": "Tailored",
        "occasions": ["wedding", "festive"], "sizes": ["S", "M", "L", "XL", "XXL"],
        "tags": ["wedding", "festive", "bandhgala", "bestseller"], "in_stock": True, "featured": True,
        "size_stock": {"S": 6, "M": 10, "L": 8, "XL": 5, "XXL": 3},
        "badges": ["bestseller"],
        "care": "Dry clean only. Hang on padded hanger to maintain shape.",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "product_id": "prod_008", "name": "Navy Wool Bandhgala", "slug": "navy-wool-bandhgala",
        "short_description": "Versatile navy bandhgala for formal and festive occasions",
        "description": "A modern bandhgala in deep navy wool with subtle herringbone texture. Versatile enough for board rooms and baraat alike. Features a hidden placket, functioning cuff buttons and dual vents for ease of movement.",
        "price": 22000, "compare_price": 26000, "images": [IMG_SHERWANI1, IMG_ARCH, IMG_SHERWANI2],
        "category": "bandhgala", "fabric": "Wool", "color": "Navy", "fit": "Slim",
        "occasions": ["festive", "casual"], "sizes": ["M", "L", "XL"],
        "tags": ["festive", "casual", "bandhgala"], "in_stock": True, "featured": False,
        "size_stock": {"M": 7, "L": 5, "XL": 2},
        "badges": [],
        "care": "Dry clean only. Use cedar blocks to prevent moths.",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "product_id": "prod_009", "name": "Heritage Jodhpuri Jacket", "slug": "heritage-jodhpuri-jacket",
        "short_description": "Signature Jodhpuri jacket with hand-embroidered crest detailing",
        "description": "Inspired by the royal courts of Jodhpur, this jacket features a unique asymmetric closure and hand-embroidered crest on the breast pocket. Crafted from premium cotton-silk blend with a polished brass button detail.",
        "price": 35000, "compare_price": 42000, "images": [IMG_WEDDING, IMG_SHERWANI1, IMG_GOLD],
        "category": "jodhpuri", "fabric": "Cotton-Silk Blend", "color": "Maroon", "fit": "Tailored",
        "occasions": ["wedding", "festive"], "sizes": ["S", "M", "L", "XL"],
        "tags": ["wedding", "jodhpuri", "premium", "new"], "in_stock": True, "featured": True,
        "size_stock": {"S": 3, "M": 5, "L": 4, "XL": 2},
        "badges": ["new"],
        "care": "Dry clean only. Store in garment bag.",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "product_id": "prod_010", "name": "Sage Green Jodhpuri Set", "slug": "sage-green-jodhpuri-set",
        "short_description": "Complete Jodhpuri set in sage green with matching trousers",
        "description": "A fresh take on the Jodhpuri silhouette. The sage green jacket is paired with matching high-waisted trousers and a silk pocket square. The subtle tonal embroidery on the collar adds a refined finish.",
        "price": 32000, "compare_price": 38000, "images": [IMG_FESTIVE, IMG_KURTA1, IMG_WEDDING],
        "category": "jodhpuri", "fabric": "Silk Blend", "color": "Sage Green", "fit": "Regular",
        "occasions": ["festive", "wedding"], "sizes": ["S", "M", "L", "XL", "XXL"],
        "tags": ["festive", "jodhpuri", "set"], "in_stock": True, "featured": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "product_id": "prod_011", "name": "Embroidered Nehru Jacket", "slug": "embroidered-nehru-jacket",
        "short_description": "Versatile Nehru jacket with subtle threadwork embroidery",
        "description": "Layer this Nehru jacket over a plain kurta or a crisp shirt for an instant festive upgrade. The all-over threadwork in tonal colours creates texture without being loud. Lined in soft cotton for comfort.",
        "price": 15000, "compare_price": 18000, "images": [IMG_SHERWANI1, IMG_FESTIVE, IMG_TEXTURE],
        "category": "nehru_jacket", "fabric": "Cotton Silk", "color": "Beige", "fit": "Regular",
        "occasions": ["festive", "casual"], "sizes": ["S", "M", "L", "XL", "XXL"],
        "tags": ["festive", "casual", "nehru_jacket", "new"], "in_stock": True, "featured": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "product_id": "prod_012", "name": "Ivory Festive Kurta Set", "slug": "ivory-festive-kurta-set",
        "short_description": "Elegant ivory kurta-pyjama set with gold accents",
        "description": "An essential in every man's ethnic wardrobe. This ivory kurta features delicate gold gota patti work on the neckline and cuffs. Comes with matching straight-cut pyjamas. Ideal for haldi ceremonies, pujas and family celebrations.",
        "price": 16500, "compare_price": 20000, "images": [IMG_KURTA1, IMG_GOLD, IMG_FESTIVE],
        "category": "kurta", "fabric": "Modal Silk", "color": "Ivory", "fit": "Relaxed",
        "occasions": ["festive", "wedding"], "sizes": ["S", "M", "L", "XL"],
        "tags": ["festive", "kurta", "set", "bestseller"], "in_stock": True, "featured": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
]

SEED_COLLECTIONS = [
    {"collection_id": "col_001", "name": "Wedding", "slug": "wedding", "description": "Timeless ensembles for the most important day. From opulent sherwanis to regal bandhgalas.", "hero_image": IMG_WEDDING, "occasion_tags": ["wedding"], "featured": True, "sort_order": 1},
    {"collection_id": "col_002", "name": "Festive", "slug": "festive", "description": "Celebrate Diwali, Eid, and every occasion in between with distinguished style.", "hero_image": IMG_FESTIVE, "occasion_tags": ["festive"], "featured": True, "sort_order": 2},
    {"collection_id": "col_003", "name": "Casual", "slug": "casual", "description": "Elevated everyday ethnics. Handloom kurtas and relaxed silhouettes for the modern gentleman.", "hero_image": IMG_KURTA1, "occasion_tags": ["casual"], "featured": True, "sort_order": 3},
    {"collection_id": "col_004", "name": "New Arrivals", "slug": "new-arrivals", "description": "The latest additions to our atelier. Fresh silhouettes, timeless craft.", "hero_image": IMG_TEXTURE, "occasion_tags": [], "featured": True, "sort_order": 4},
    {"collection_id": "col_005", "name": "Sherwanis", "slug": "sherwanis", "description": "The crown of ceremonial dressing. Each sherwani is a testament to generations of embroidery craft.", "hero_image": IMG_SHERWANI1, "occasion_tags": ["wedding"], "featured": False, "sort_order": 5},
    {"collection_id": "col_006", "name": "All Products", "slug": "all", "description": "Explore our complete collection of handcrafted Indian menswear.", "hero_image": IMG_ARCH, "occasion_tags": [], "featured": True, "sort_order": 6},
]

SEED_CMS = [
    {"key": "hero", "title": "The Art of Dressing Well", "subtitle": "Traditional and modern clothing from the heart of Jaipur", "image": IMG_HERO},
    {"key": "brand_story", "title": "Rooted in Craft", "body": "Located in the vibrant Johri Bazar of Jaipur, Angarakha offers a diverse range of traditional and modern ethnic wear. Every thread is chosen with intention, every stitch placed by artisan hands that have perfected their craft over generations. We believe ceremonial dressing should feel as natural as it looks — confident, unhurried, unmistakably yours.", "image": IMG_ARCH},
    {"key": "store_details", "address": "Building No. 11, Ghee Walo Ka Rasta, Johri Bazar, Jaipur-302001, Rajasthan", "phone": "+91 98285 41068", "email": "", "timings": "Daily: 10:30 AM – 9:30 PM", "map_url": "https://maps.google.com/?q=26.9239,75.8267", "image": IMG_ARCH},
    {"key": "services", "items": [
        {"title": "Styling Assistance", "description": "Our style consultants help you find the right ensemble for your occasion, body type and personal taste."},
        {"title": "Secure Delivery", "description": "Every garment is packed with care. Free shipping on orders above Rs 5,000."},
        {"title": "Visit Our Store", "description": "Visit our store in Johri Bazar for a truly personal shopping experience."}
    ]},
    {"key": "testimonials", "items": [
        {"quote": "The sherwani I wore on my wedding day was unlike anything I had ever seen. The craftsmanship was impeccable.", "name": "Arjun Mehta", "role": "Groom, Jaipur"},
        {"quote": "I ordered a bandhgala for my brother's reception. The fit was perfect and the fabric quality was outstanding.", "name": "Priya Sharma", "role": "Sister of the Groom, Delhi"},
        {"quote": "Finally, an Indian menswear brand that understands modern aesthetics without losing heritage.", "name": "Kabir Rathore", "role": "Fashion Consultant, Mumbai"},
        {"quote": "The Jodhpuri jacket I purchased has become my go-to for every formal event. Truly versatile.", "name": "Vikram Singh", "role": "Entrepreneur, Udaipur"}
    ]},
    {"key": "faqs", "items": [
        {"question": "What is your shipping policy?", "answer": "We offer free shipping on all orders above Rs 5,000 across India. Standard delivery takes 5-7 business days. Express delivery (2-3 days) is available at an additional charge."},
        {"question": "Do you offer alterations?", "answer": "Yes. All garments can be altered for a perfect fit. First alteration is complimentary within 14 days of delivery. Visit our Jaipur store or ship the garment back to us."},
        {"question": "How do I find my size?", "answer": "Each product page includes a detailed size guide with measurements in inches and centimetres. If you are between sizes, our styling team is available via WhatsApp to help."},
        {"question": "What is your return policy?", "answer": "We accept returns within 14 days of delivery for unused items in original packaging. Custom and altered pieces are non-returnable. Refunds are processed within 7 business days."},
        {"question": "Can I book a private appointment?", "answer": "Absolutely. Use our contact form or call us directly to schedule a private session at our Jaipur atelier. We recommend booking at least 48 hours in advance."},
        {"question": "Do you ship internationally?", "answer": "Yes. We ship to select countries. International orders typically arrive within 10-14 business days. Customs duties are the responsibility of the buyer."}
    ]}
]

SEED_REVIEWS = [
    {"review_id": "rev_001", "product_slug": "royal-ivory-sherwani", "user_id": "seed", "user_name": "Rajesh K.", "rating": 5, "title": "Absolutely stunning", "body": "Wore this for my wedding and received countless compliments. The embroidery work is incredible.", "fit_feedback": "True to size", "created_at": datetime.now(timezone.utc).isoformat()},
    {"review_id": "rev_002", "product_slug": "royal-ivory-sherwani", "user_id": "seed", "user_name": "Amit P.", "rating": 4, "title": "Premium quality", "body": "Excellent fabric and stitching. Slightly heavy but expected for this level of work.", "fit_feedback": "Slightly large", "created_at": datetime.now(timezone.utc).isoformat()},
    {"review_id": "rev_003", "product_slug": "classic-black-bandhgala", "user_id": "seed", "user_name": "Nikhil S.", "rating": 5, "title": "My new go-to formal", "body": "The fit is impeccable. I have worn this to three events already and it always impresses.", "fit_feedback": "True to size", "created_at": datetime.now(timezone.utc).isoformat()},
    {"review_id": "rev_004", "product_slug": "chanderi-silk-kurta", "user_id": "seed", "user_name": "Karan M.", "rating": 5, "title": "Light and elegant", "body": "Perfect for Jaipur summers. The Chanderi silk feels like air on the skin.", "fit_feedback": "True to size", "created_at": datetime.now(timezone.utc).isoformat()},
]

async def seed_database():
    count = await db.products.count_documents({})
    if count == 0:
        logger.info("Seeding database with initial data...")
        await db.products.insert_many(SEED_PRODUCTS)
        await db.collections.insert_many(SEED_COLLECTIONS)
        for block in SEED_CMS:
            await db.cms.insert_one(block)
        await db.reviews.insert_many(SEED_REVIEWS)
        logger.info(f"Seeded {len(SEED_PRODUCTS)} products, {len(SEED_COLLECTIONS)} collections, {len(SEED_CMS)} CMS blocks, {len(SEED_REVIEWS)} reviews")
    else:
        logger.info(f"Database already has {count} products, skipping seed.")

# ─── Abandoned Cart Email ──────────────────────────────────────────────────────

async def send_abandoned_cart_email(email, name, items):
    """Send abandoned cart recovery email"""
    try:
        if not RESEND_ENABLED:
            logger.info(f"[MOCK EMAIL] Abandoned cart reminder to {email}")
            return False
        items_html = ""
        for item in items:
            items_html += f"""<tr><td style="padding:10px;border-bottom:1px solid #eee;">
                <strong>{item.get('name','')}</strong><br/>
                <span style="color:#666;font-size:14px;">Size: {item.get('size','')} | Qty: {item.get('quantity',1)}</span>
            </td><td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">Rs {item.get('price',0):,}</td></tr>"""
        total = sum(i.get("price",0)*i.get("quantity",1) for i in items)
        html = f"""<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px;"><tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:#1a1a1a;padding:30px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:32px;letter-spacing:4px;">ANGARAKHA</h1></td></tr>
        <tr><td style="padding:40px 30px;text-align:center;"><h2 style="color:#1a1a1a;font-size:24px;">You left something behind!</h2>
        <p style="color:#666;">Hi {name or 'there'}, your cart is waiting for you.</p></td></tr>
        <tr><td style="padding:0 30px 20px;"><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;">{items_html}</table>
        <p style="text-align:right;font-size:18px;font-weight:bold;margin-top:15px;">Total: Rs {total:,}</p></td></tr>
        <tr><td style="padding:20px 30px;text-align:center;">
        <p style="color:#666;">Complete your purchase before these items sell out!</p></td></tr>
        <tr><td style="padding:30px;text-align:center;background:#1a1a1a;">
        <p style="margin:0;color:#fff;font-size:24px;letter-spacing:3px;">ANGARAKHA</p></td></tr>
        </table></td></tr></table></body></html>"""
        params = {"from": SENDER_EMAIL, "to": [email], "subject": "You left items in your cart! | Angarakha", "html": html}
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Abandoned cart email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send abandoned cart email: {e}")
        return False

# ─── Register Sub-routers ─────────────────────────────────────────────────────

from routes.wishlist import router as wishlist_router
from routes.addresses import router as addresses_router
from routes.profile import router as profile_router
from routes.search_enhanced import router as search_router
from routes.inventory import router as inventory_router
from routes.returns import router as returns_router
from routes.abandoned_cart import router as abandoned_router
from routes.giftcards import router as giftcards_router

# Set DB and helpers for all sub-routers
from routes import wishlist, addresses, profile, search_enhanced, inventory, returns, abandoned_cart, giftcards
for mod in [wishlist, addresses, profile, search_enhanced, inventory, returns, abandoned_cart, giftcards]:
    mod.set_db(db)

wishlist.set_helpers(get_current_user, require_user)
addresses.set_helpers(require_user)
profile.set_helpers(require_user)
returns.set_helpers(get_current_user, require_user)
returns.set_admin_helper(require_admin)
inventory.set_admin_helper(require_admin)
abandoned_cart.set_admin_helper(require_admin)
abandoned_cart.set_email_config(RESEND_ENABLED, send_abandoned_cart_email)
giftcards.set_helpers(require_user)
giftcards.set_admin_helper(require_admin)

app.include_router(wishlist_router)
app.include_router(addresses_router)
app.include_router(profile_router)
app.include_router(search_router)
app.include_router(inventory_router)
app.include_router(returns_router)
app.include_router(abandoned_router)
app.include_router(giftcards_router)

# ─── App Setup ─────────────────────────────────────────────────────────────────

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await seed_database()
    await db.products.create_index("slug", unique=True)
    await db.products.create_index("occasions")
    await db.products.create_index("category")
    await db.products.create_index([("name", "text"), ("description", "text")])
    await db.collections.create_index("slug", unique=True)
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.user_sessions.create_index("session_token")
    await db.wishlists.create_index("user_id", unique=True)
    await db.addresses.create_index("user_id")
    await db.returns.create_index("user_id")
    await db.giftcards.create_index("code", unique=True)

@app.on_event("shutdown")
async def shutdown():
    client.close()
