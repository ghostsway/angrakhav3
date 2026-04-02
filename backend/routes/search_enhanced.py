from fastapi import APIRouter, Request
from typing import Optional

router = APIRouter(prefix="/api")

def set_db(database):
    global db
    db = database

@router.get("/search/autocomplete")
async def autocomplete(q: str = ""):
    if not q or len(q) < 2:
        return {"suggestions": []}
    products = await db.products.find(
        {"name": {"$regex": q, "$options": "i"}, "in_stock": True},
        {"_id": 0, "name": 1, "slug": 1, "price": 1, "images": 1, "category": 1}
    ).limit(6).to_list(6)
    suggestions = [{
        "name": p["name"], "slug": p["slug"], "price": p["price"],
        "image": (p.get("images") or [""])[0], "category": p.get("category", "")
    } for p in products]
    return {"suggestions": suggestions}

@router.get("/search/popular")
async def popular_searches():
    # Return popular categories/terms
    popular = [
        {"term": "Sherwani", "slug": "/collections/sherwanis"},
        {"term": "Wedding", "slug": "/collections/wedding"},
        {"term": "Kurta", "slug": "/search?q=kurta"},
        {"term": "Bandhgala", "slug": "/search?q=bandhgala"},
        {"term": "Festive", "slug": "/collections/festive"},
        {"term": "Jodhpuri", "slug": "/search?q=jodhpuri"},
    ]
    return {"popular": popular}

@router.get("/search/filters")
async def get_available_filters():
    """Get all available filter options from products"""
    products = await db.products.find({"in_stock": True}, {"_id": 0, "category": 1, "fabric": 1, "color": 1, "occasions": 1, "sizes": 1, "price": 1}).to_list(500)
    categories = sorted(set(p.get("category", "") for p in products if p.get("category")))
    fabrics = sorted(set(p.get("fabric", "") for p in products if p.get("fabric")))
    colors = sorted(set(p.get("color", "") for p in products if p.get("color")))
    occasions = sorted(set(o for p in products for o in p.get("occasions", [])))
    sizes = sorted(set(s for p in products for s in p.get("sizes", [])), key=lambda x: ["XS","S","M","L","XL","XXL","3XL"].index(x) if x in ["XS","S","M","L","XL","XXL","3XL"] else 99)
    prices = [p.get("price", 0) for p in products if p.get("price")]
    return {
        "categories": categories,
        "fabrics": fabrics,
        "colors": colors,
        "occasions": occasions,
        "sizes": sizes,
        "price_range": {"min": min(prices) if prices else 0, "max": max(prices) if prices else 100000}
    }
