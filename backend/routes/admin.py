import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException

from models import CouponCreate

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)

def set_db(database):
    global db
    db = database

def set_helpers(get_user, require):
    global get_current_user, require_admin
    get_current_user = get_user
    require_admin = require

@router.post("/admin/setup")
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

@router.get("/admin/analytics")
async def admin_analytics(request: Request):
    await require_admin(request)
    total_orders = await db.orders.count_documents({})
    total_customers = await db.users.count_documents({})
    total_products = await db.products.count_documents({})
    total_enquiries = await db.enquiries.count_documents({})
    total_subscribers = await db.newsletter.count_documents({})

    orders = await db.orders.find({}, {"_id": 0, "total": 1, "status": 1, "payment_status": 1, "created_at": 1, "items": 1}).to_list(1000)
    total_revenue = sum(o.get("total", 0) for o in orders)
    avg_order_value = round(total_revenue / total_orders, 2) if total_orders else 0

    status_counts = {}
    for o in orders:
        s = o.get("status", "unknown")
        status_counts[s] = status_counts.get(s, 0) + 1

    from collections import defaultdict
    monthly = defaultdict(float)
    for o in orders:
        ca = o.get("created_at", "")
        if ca:
            month_key = ca[:7] if isinstance(ca, str) else ca.strftime("%Y-%m")
            monthly[month_key] += o.get("total", 0)
    monthly_data = [{"month": k, "revenue": round(v)} for k, v in sorted(monthly.items())[-6:]]

    product_counts = defaultdict(lambda: {"count": 0, "revenue": 0, "name": ""})
    for o in orders:
        for item in o.get("items", []):
            pid = item.get("product_id", "")
            product_counts[pid]["count"] += item.get("quantity", 0)
            product_counts[pid]["revenue"] += item.get("price", 0) * item.get("quantity", 0)
            product_counts[pid]["name"] = item.get("name", "")
    top_products = sorted(product_counts.values(), key=lambda x: x["revenue"], reverse=True)[:5]

    recent = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)

    return {
        "total_revenue": round(total_revenue, 2), "total_orders": total_orders,
        "avg_order_value": avg_order_value, "total_customers": total_customers,
        "total_products": total_products, "total_enquiries": total_enquiries,
        "total_subscribers": total_subscribers,
        "order_status": status_counts, "monthly_revenue": monthly_data,
        "top_products": top_products, "recent_orders": recent
    }

@router.get("/admin/products")
async def admin_list_products(request: Request, q: str = "", page: int = 1, limit: int = 20):
    await require_admin(request)
    limit = min(max(1, limit), 100)
    query = {}
    if q:
        query["$or"] = [{"name": {"$regex": q, "$options": "i"}}, {"category": {"$regex": q, "$options": "i"}}]
    total = await db.products.count_documents(query)
    products = await db.products.find(query, {"_id": 0}).sort("created_at", -1).skip((page-1)*limit).limit(limit).to_list(limit)
    return {"products": products, "total": total, "page": page, "pages": max(1, (total+limit-1)//limit)}

@router.post("/admin/products")
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

PRODUCT_UPDATABLE_FIELDS = {
    "name", "slug", "short_description", "description", "price", "compare_price",
    "images", "category", "fabric", "color", "fit", "occasions", "sizes", "size_stock",
    "tags", "in_stock", "featured", "care", "lining", "badges",
}

@router.put("/admin/products/{product_id}")
async def admin_update_product(product_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    # Only allow known fields to prevent arbitrary field injection
    update_data = {k: v for k, v in body.items() if k in PRODUCT_UPDATABLE_FIELDS}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.products.update_one({"product_id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    return product

@router.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str, request: Request):
    await require_admin(request)
    result = await db.products.delete_one({"product_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"status": "deleted"}

@router.get("/admin/orders")
async def admin_list_orders(request: Request, status: str = "", page: int = 1, limit: int = 20):
    await require_admin(request)
    limit = min(max(1, limit), 100)
    query = {}
    if status:
        query["status"] = status
    total = await db.orders.count_documents(query)
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip((page-1)*limit).limit(limit).to_list(limit)
    return {"orders": orders, "total": total, "page": page, "pages": max(1, (total+limit-1)//limit)}

@router.put("/admin/orders/{order_id}")
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

@router.get("/admin/collections")
async def admin_list_collections(request: Request):
    await require_admin(request)
    collections = await db.collections.find({}, {"_id": 0}).sort("sort_order", 1).to_list(50)
    return {"collections": collections}

@router.post("/admin/collections")
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

COLLECTION_UPDATABLE_FIELDS = {
    "name", "slug", "description", "hero_image", "occasion_tags", "featured", "sort_order"
}

@router.put("/admin/collections/{collection_id}")
async def admin_update_collection(collection_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    update_data = {k: v for k, v in body.items() if k in COLLECTION_UPDATABLE_FIELDS}
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields provided")
    await db.collections.update_one({"collection_id": collection_id}, {"$set": update_data})
    col = await db.collections.find_one({"collection_id": collection_id}, {"_id": 0})
    return col

@router.delete("/admin/collections/{collection_id}")
async def admin_delete_collection(collection_id: str, request: Request):
    await require_admin(request)
    await db.collections.delete_one({"collection_id": collection_id})
    return {"status": "deleted"}

@router.get("/admin/coupons")
async def admin_list_coupons(request: Request):
    await require_admin(request)
    coupons = await db.coupons.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"coupons": coupons}

@router.post("/admin/coupons")
async def admin_create_coupon(data: CouponCreate, request: Request):
    await require_admin(request)
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

@router.put("/admin/coupons/{coupon_id}")
async def admin_update_coupon(coupon_id: str, data: CouponCreate, request: Request):
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

@router.delete("/admin/coupons/{coupon_id}")
async def admin_delete_coupon(coupon_id: str, request: Request):
    await require_admin(request)
    result = await db.coupons.delete_one({"coupon_id": coupon_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return {"message": "Coupon deleted"}

@router.get("/admin/enquiries")
async def admin_list_enquiries(request: Request, page: int = 1, limit: int = 20):
    await require_admin(request)
    limit = min(max(1, limit), 100)
    total = await db.enquiries.count_documents({})
    enquiries = await db.enquiries.find({}, {"_id": 0}).sort("created_at", -1).skip((page-1)*limit).limit(limit).to_list(limit)
    return {"enquiries": enquiries, "total": total}

@router.put("/admin/enquiries/{enquiry_id}")
async def admin_update_enquiry(enquiry_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    await db.enquiries.update_one({"enquiry_id": enquiry_id}, {"$set": {"status": body.get("status", "reviewed")}})
    return {"status": "updated"}

@router.get("/admin/cms")
async def admin_list_cms(request: Request):
    await require_admin(request)
    blocks = await db.cms.find({}, {"_id": 0}).to_list(50)
    return {"blocks": blocks}

CMS_UPDATABLE_FIELDS = {
    "key", "title", "content", "images", "active", "metadata", "type"
}

@router.put("/admin/cms/{key}")
async def admin_update_cms(key: str, request: Request):
    await require_admin(request)
    body = await request.json()
    update_data = {k: v for k, v in body.items() if k in CMS_UPDATABLE_FIELDS}
    update_data["key"] = key
    await db.cms.update_one({"key": key}, {"$set": update_data}, upsert=True)
    block = await db.cms.find_one({"key": key}, {"_id": 0})
    return block

@router.get("/admin/customers")
async def admin_list_customers(request: Request, page: int = 1, limit: int = 20):
    await require_admin(request)
    limit = min(max(1, limit), 100)
    total = await db.users.count_documents({})
    customers = await db.users.find({}, {"_id": 0, "session_token": 0, "password_hash": 0}).sort("created_at", -1).skip((page-1)*limit).limit(limit).to_list(limit)
    return {"customers": customers, "total": total}

@router.get("/admin/newsletter")
async def admin_list_newsletter(request: Request):
    await require_admin(request)
    subs = await db.newsletter.find({}, {"_id": 0}).sort("subscribed_at", -1).to_list(500)
    return {"subscribers": subs, "total": len(subs)}
