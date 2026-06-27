import uuid
import httpx
from fastapi import APIRouter, Request, Response, HTTPException
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/api")

def set_db(database):
    global db
    db = database

def set_helpers(get_user, require):
    global get_current_user, require_user
    get_current_user = get_user
    require_user = require

@router.post("/auth/session")
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
        # Generate a unique referral code based on email prefix or random string
        import random, string
        base_code = email.split('@')[0].upper()[:6]
        base_code = ''.join(c for c in base_code if c.isalnum())
        if len(base_code) < 3:
            base_code += ''.join(random.choices(string.ascii_uppercase, k=3))
        random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        referral_code = f"{base_code}{random_suffix}"
        
        # Ensure it's truly unique just in case
        while await db.users.find_one({"referral_code": referral_code}):
            random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
            referral_code = f"{base_code}{random_suffix}"
            
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": name, "picture": picture,
            "phone": "", "addresses": [], "created_at": datetime.now(timezone.utc),
            "referral_code": referral_code
        })
        
        # Initialize referral stats
        await db.referrals.insert_one({
            "user_id": user_id,
            "referral_code": referral_code,
            "total_referrals": 0,
            "available_credit": 0,
            "referred_users": []
        })
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7*24*60*60)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user

@router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_many({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"status": "ok"}

from utils.limiter import limiter

@router.post("/admin/login")
@limiter.limit("5/minute")
async def admin_login(request: Request, response: Response):
    import os
    import bcrypt
    
    body = await request.json()
    username = body.get("username")
    password = body.get("password")
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
        
    admin_username = os.environ.get("ADMIN_USERNAME")
    admin_password_hash = os.environ.get("ADMIN_PASSWORD_HASH")
    
    if not admin_username or not admin_password_hash:
        raise HTTPException(status_code=500, detail="Admin credentials not configured")
        
    if username != admin_username:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    # Verify password
    try:
        is_valid = bcrypt.checkpw(password.encode('utf-8'), admin_password_hash.encode('utf-8'))
        if not is_valid:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except Exception as e:
        print(f"Bcrypt error: {e}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    # Generate session token and user ID if not exists
    session_token = f"admin_session_{uuid.uuid4().hex}"
    admin_id = "admin_001"
    
    # Set the user session so the existing auth middleware considers this an authenticated user
    # Wait, the auth middleware checks get_current_user. Let's make sure the admin user exists in users collection
    admin_user = await db.users.find_one({"email": f"{username}@admin.local"}, {"_id": 0})
    if not admin_user:
        await db.users.insert_one({
            "user_id": admin_id, "email": f"{username}@admin.local", "name": "Admin", "picture": "",
            "phone": "", "addresses": [], "created_at": datetime.now(timezone.utc),
            "role": "admin", "is_admin": True
        })
    else:
        # Ensure both role and is_admin are set
        await db.users.update_one(
            {"user_id": admin_user["user_id"]},
            {"$set": {"role": "admin", "is_admin": True}}
        )
        admin_id = admin_user["user_id"]
        
    await db.user_sessions.delete_many({"user_id": admin_id})
    await db.user_sessions.insert_one({
        "user_id": admin_id, "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7*24*60*60)
    return {"status": "ok", "message": "Logged in successfully", "role": "admin"}
