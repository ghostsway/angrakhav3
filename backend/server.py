import os
import logging
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from database import client, db
from seed_data import seed_database
from auth import get_current_user, require_user, require_admin, get_guest_token
from utils.email import send_order_confirmation_email, send_abandoned_cart_email, RESEND_ENABLED
from utils.notifications import send_order_notification_telegram
from utils.cart_helpers import set_db as cart_helpers_set_db

from routes.wishlist import router as wishlist_router
from routes.addresses import router as addresses_router
from routes.profile import router as profile_router
from routes.search_enhanced import router as search_enhanced_router
from routes.inventory import router as inventory_router
from routes.returns import router as returns_router
from routes.abandoned_cart import router as abandoned_cart_router
from routes.giftcards import router as giftcards_router

from routes.auth_routes import router as auth_router, set_db as auth_set_db, set_helpers as auth_set_helpers
from routes.products import router as products_router, set_db as products_set_db
from routes.cart import router as cart_router, set_db as cart_set_db, set_helpers as cart_set_helpers
from routes.orders import router as orders_router, set_db as orders_set_db, set_helpers as orders_set_helpers, set_email_config as orders_set_email_config, set_notification_config as orders_set_notification_config
from routes.public import router as public_router, set_db as public_set_db, set_helpers as public_set_helpers
from routes.admin import router as admin_router, set_db as admin_set_db, set_helpers as admin_set_helpers

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()

# --- Rate Limiting Setup ---
from utils.limiter import limiter
from slowapi.errors import RateLimitExceeded
from starlette.responses import JSONResponse
from fastapi import Request

app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
def custom_rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": f"Rate limit exceeded: {exc.detail}"},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin") or "*",
            "Access-Control-Allow-Credentials": "true"
        }
    )

cors_origins = os.getenv("CORS_ORIGINS", "https://angarakha.com,https://www.angarakha.com,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Register Existing Sub-routers ───────────────────────────────────────────
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
app.include_router(search_enhanced_router)
app.include_router(inventory_router)
app.include_router(returns_router)
app.include_router(abandoned_cart_router)
app.include_router(giftcards_router)

# ─── Register New Sub-routers ───────────────────────────────────────────────
auth_set_db(db)
auth_set_helpers(get_current_user, require_user)

products_set_db(db)

cart_set_db(db)
cart_helpers_set_db(db)
cart_set_helpers(get_current_user, require_user, get_guest_token)

orders_set_db(db)
orders_set_helpers(get_current_user, require_user, get_guest_token)
orders_set_email_config(send_order_confirmation_email)
orders_set_notification_config(send_order_notification_telegram)

public_set_db(db)
public_set_helpers(require_user)

admin_set_db(db)
admin_set_helpers(get_current_user, require_admin)

app.include_router(auth_router)
app.include_router(products_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(public_router)
app.include_router(admin_router)

# ─── App Setup ─────────────────────────────────────────────────────────────────

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
