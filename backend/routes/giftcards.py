from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
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

def generate_gift_code():
    return "ANG-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))

class GiftCardPurchase(BaseModel):
    amount: float
    recipient_name: str
    recipient_email: str
    sender_name: str
    message: Optional[str] = ""

class GiftCardRedeem(BaseModel):
    code: str

@router.post("/giftcards/purchase")
async def purchase_gift_card(data: GiftCardPurchase, request: Request):
    code = generate_gift_code()
    while await db.giftcards.find_one({"code": code}):
        code = generate_gift_code()
    card = {
        "giftcard_id": f"gc_{uuid.uuid4().hex[:10]}",
        "code": code,
        "amount": data.amount,
        "balance": data.amount,
        "recipient_name": data.recipient_name,
        "recipient_email": data.recipient_email,
        "sender_name": data.sender_name,
        "message": data.message,
        "status": "active",
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=365)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.giftcards.insert_one(card)
    card.pop("_id", None)
    return card

@router.post("/giftcards/check")
async def check_gift_card(data: GiftCardRedeem):
    card = await db.giftcards.find_one({"code": data.code.upper(), "status": "active"}, {"_id": 0})
    if not card:
        raise HTTPException(status_code=404, detail="Gift card not found or inactive")
    if card.get("balance", 0) <= 0:
        raise HTTPException(status_code=400, detail="Gift card has no balance")
    return {"valid": True, "balance": card["balance"], "code": card["code"]}

@router.get("/admin/giftcards")
async def admin_list_giftcards(request: Request):
    await require_admin(request)
    cards = await db.giftcards.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"giftcards": cards, "total": len(cards)}
