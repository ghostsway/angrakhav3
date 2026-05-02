import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException

from models import EnquiryCreate, NewsletterCreate, ReviewCreate, CouponValidate

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)

def set_db(database):
    global db
    db = database

def set_helpers(require):
    global require_user
    require_user = require

@router.post("/enquiry")
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

@router.post("/newsletter")
async def subscribe_newsletter(data: NewsletterCreate):
    existing = await db.newsletter.find_one({"email": data.email})
    if existing:
        return {"status": "already_subscribed"}
    await db.newsletter.insert_one({"email": data.email, "subscribed_at": datetime.now(timezone.utc).isoformat()})
    logger.info(f"[MOCK EMAIL] Newsletter welcome to {data.email}")
    return {"status": "subscribed"}

@router.get("/reviews/{product_slug}")
async def get_reviews(product_slug: str):
    reviews = await db.reviews.find({"product_slug": product_slug}, {"_id": 0}).sort("created_at", -1).to_list(50)
    if reviews:
        avg = sum(r["rating"] for r in reviews) / len(reviews)
    else:
        avg = 0
    return {"reviews": reviews, "average_rating": round(avg, 1), "total": len(reviews)}

@router.post("/reviews/{product_slug}")
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

@router.get("/cms/{key}")
async def get_cms(key: str):
    block = await db.cms.find_one({"key": key}, {"_id": 0})
    if not block:
        raise HTTPException(status_code=404, detail="CMS block not found")
    return block

@router.post("/coupons/validate")
async def validate_coupon(data: CouponValidate):
    """Validate a coupon code and return discount amount"""
    coupon = await db.coupons.find_one({"code": data.code.upper(), "active": True})
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    if coupon.get("expiry_date"):
        from datetime import datetime as dt
        expiry = dt.fromisoformat(coupon["expiry_date"].replace('Z', '+00:00'))
        if datetime.now(timezone.utc) > expiry:
            raise HTTPException(status_code=400, detail="Coupon has expired")
    
    if coupon.get("usage_limit") and coupon.get("times_used", 0) >= coupon["usage_limit"]:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")
    
    if data.order_total < coupon.get("min_order", 0):
        raise HTTPException(
            status_code=400, 
            detail=f"Minimum order value of ₹{coupon['min_order']} required"
        )
    
    if coupon["discount_type"] == "percentage":
        discount = (data.order_total * coupon["discount_value"]) / 100
        if coupon.get("max_discount"):
            discount = min(discount, coupon["max_discount"])
    else:
        discount = coupon["discount_value"]
    
    return {
        "valid": True,
        "code": coupon["code"],
        "discount_type": coupon["discount_type"],
        "discount_value": coupon["discount_value"],
        "discount_amount": round(discount, 2),
        "message": f"Coupon applied! You saved ₹{round(discount, 2)}"
    }
