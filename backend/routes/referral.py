from fastapi import APIRouter, Request, HTTPException
from datetime import datetime, timezone
import uuid
import random
import string

router = APIRouter(prefix="/api")

def set_db(database):
    global db
    db = database

def set_helpers(require):
    global require_user
    require_user = require

def set_admin_helper(require):
    global require_admin
    require_admin = require

def generate_referral_code(name):
    prefix = (name or "ANG")[:4].upper().replace(" ", "")
    suffix = "".join(random.choices(string.digits, k=4))
    return f"{prefix}{suffix}"

@router.get("/referral")
async def get_referral(request: Request):
    user = await require_user(request)
    ref = await db.referrals.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not ref:
        code = generate_referral_code(user.get("name", ""))
        while await db.referrals.find_one({"code": code}):
            code = generate_referral_code(user.get("name", ""))
        ref = {
            "referral_id": f"ref_{uuid.uuid4().hex[:10]}",
            "user_id": user["user_id"],
            "code": code,
            "total_referrals": 0,
            "successful_referrals": 0,
            "total_earnings": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.referrals.insert_one(ref)
        ref.pop("_id", None)
    return ref

@router.post("/referral/apply")
async def apply_referral(request: Request):
    body = await request.json()
    code = body.get("code", "").upper()
    if not code:
        raise HTTPException(status_code=400, detail="Referral code required")
    ref = await db.referrals.find_one({"code": code}, {"_id": 0})
    if not ref:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    return {"valid": True, "code": code, "discount": 10, "message": "Referral code valid! You get 10% off your first order."}

@router.get("/admin/referrals")
async def admin_list_referrals(request: Request):
    await require_admin(request)
    refs = await db.referrals.find({}, {"_id": 0}).sort("total_referrals", -1).to_list(100)
    enriched = []
    for r in refs:
        user = await db.users.find_one({"user_id": r["user_id"]}, {"_id": 0, "name": 1, "email": 1})
        enriched.append({**r, "user_name": user.get("name", "") if user else "", "user_email": user.get("email", "") if user else ""})
    return {"referrals": enriched}
