from typing import Optional
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api")

def set_db(database):
    global db
    db = database

@router.get("/products")
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

@router.get("/products/{slug}")
async def get_product(slug: str):
    product = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.get("/collections")
async def list_collections():
    collections = await db.collections.find({}, {"_id": 0}).sort("sort_order", 1).to_list(20)
    return {"collections": collections}

@router.get("/collections/{slug}")
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

@router.get("/search")
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
