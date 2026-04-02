from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/api")

def set_db(database):
    global db
    db = database

def set_helpers(require):
    global require_user
    require_user = require

class AddressCreate(BaseModel):
    label: str = "Home"
    name: str
    phone: str
    line1: str
    line2: Optional[str] = ""
    city: str
    state: str
    pincode: str
    is_default: bool = False

@router.get("/addresses")
async def get_addresses(request: Request):
    user = await require_user(request)
    addresses = await db.addresses.find({"user_id": user["user_id"]}, {"_id": 0}).sort("is_default", -1).to_list(20)
    return {"addresses": addresses}

@router.post("/addresses")
async def add_address(data: AddressCreate, request: Request):
    user = await require_user(request)
    if data.is_default:
        await db.addresses.update_many({"user_id": user["user_id"]}, {"$set": {"is_default": False}})
    address = {
        "address_id": f"addr_{uuid.uuid4().hex[:10]}",
        "user_id": user["user_id"],
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.addresses.insert_one(address)
    address.pop("_id", None)
    return address

@router.put("/addresses/{address_id}")
async def update_address(address_id: str, data: AddressCreate, request: Request):
    user = await require_user(request)
    if data.is_default:
        await db.addresses.update_many({"user_id": user["user_id"]}, {"$set": {"is_default": False}})
    result = await db.addresses.update_one(
        {"address_id": address_id, "user_id": user["user_id"]},
        {"$set": {**data.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Address not found")
    addr = await db.addresses.find_one({"address_id": address_id}, {"_id": 0})
    return addr

@router.delete("/addresses/{address_id}")
async def delete_address(address_id: str, request: Request):
    user = await require_user(request)
    result = await db.addresses.delete_one({"address_id": address_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Address not found")
    return {"status": "deleted"}
