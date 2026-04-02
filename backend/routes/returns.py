from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/api")

def set_db(database):
    global db
    db = database

def set_helpers(get_user, require):
    global get_current_user, require_user
    get_current_user = get_user
    require_user = require

def set_admin_helper(require):
    global require_admin
    require_admin = require

class ReturnRequest(BaseModel):
    order_id: str
    reason: str
    type: str = "return"  # return or exchange
    items: list = []
    details: Optional[str] = ""

@router.post("/returns")
async def create_return(data: ReturnRequest, request: Request):
    user = await require_user(request)
    order = await db.orders.find_one({"order_id": data.order_id, "user_id": user["user_id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    ret = {
        "return_id": f"ret_{uuid.uuid4().hex[:10]}",
        "order_id": data.order_id,
        "order_number": order.get("order_number", ""),
        "user_id": user["user_id"],
        "type": data.type,
        "reason": data.reason,
        "details": data.details,
        "items": data.items or order.get("items", []),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.returns.insert_one(ret)
    ret.pop("_id", None)
    return ret

@router.get("/returns")
async def list_returns(request: Request):
    user = await require_user(request)
    returns = await db.returns.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"returns": returns}

@router.get("/admin/returns")
async def admin_list_returns(request: Request, status: str = ""):
    await require_admin(request)
    query = {}
    if status:
        query["status"] = status
    returns = await db.returns.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"returns": returns}

@router.put("/admin/returns/{return_id}")
async def admin_update_return(return_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    update = {}
    if "status" in body:
        update["status"] = body["status"]
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.returns.update_one({"return_id": return_id}, {"$set": update})
    ret = await db.returns.find_one({"return_id": return_id}, {"_id": 0})
    return ret
