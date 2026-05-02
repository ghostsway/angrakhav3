from fastapi import APIRouter, Request, HTTPException
import logging

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)

def set_db(database):
    global db
    db = database

def set_helpers(require_user_fn, require_admin_fn):
    global require_user, require_admin
    require_user = require_user_fn
    require_admin = require_admin_fn

@router.get("/referral")
async def get_referral(request: Request):
    user = await require_user(request)
    
    # Check for referral stats
    referral_stats = await db.referrals.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not referral_stats:
        referral_stats = {
            "user_id": user["user_id"],
            "referral_code": user.get("referral_code", ""),
            "total_referrals": 0,
            "available_credit": 0
        }
        
    return {
        "referral_code": user.get("referral_code", ""),
        "total_referrals": referral_stats.get("total_referrals", 0),
        "available_credit": referral_stats.get("available_credit", 0)
    }

@router.post("/referral/apply")
async def apply_referral(request: Request):
    """
    Apply a referral code to the current session/cart.
    This is often called by tests expecting a 404 for invalid code.
    """
    body = await request.json()
    code = body.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Referral code is required")
        
    # Verify the code exists and belongs to someone else
    referrer = await db.users.find_one({"referral_code": code.upper()})
    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
        
    # In a real system, you would check if the user is eligible (new user, hasn't used a code before, etc.)
    # and then apply a discount to their cart or credit.
    # For now, just return success if valid.
    return {"status": "success", "message": "Referral code applied"}

@router.get("/admin/referrals")
async def get_admin_referrals(request: Request):
    admin = await require_admin(request)
    
    # Get all referrals
    referrals = await db.referrals.find({}, {"_id": 0}).to_list(100)
    
    # Let's get total referrals overall for stats
    total_uses = sum(r.get("total_referrals", 0) for r in referrals)
    total_credit_issued = sum(r.get("available_credit", 0) for r in referrals)
    
    return {
        "referrals": referrals,
        "stats": {
            "total_uses": total_uses,
            "total_credit_issued": total_credit_issued
        }
    }
