from pydantic import BaseModel, Field
from typing import List, Optional


class EnquiryCreate(BaseModel):
    name: str
    email: Optional[str] = ""
    phone: str
    occasion: Optional[str] = ""
    preferred_date: Optional[str] = ""
    message: str

class NewsletterCreate(BaseModel):
    email: str

class CartItemAdd(BaseModel):
    product_id: str
    product_slug: str
    name: str
    image: str
    size: str
    color: Optional[str] = ""
    price: float = Field(..., ge=0)
    quantity: int = Field(1, ge=1)


class CouponCreate(BaseModel):
    code: str
    discount_type: str  # 'percentage' or 'fixed'
    discount_value: float = Field(..., ge=0)
    min_order: float = 0
    max_discount: Optional[float] = None
    expiry_date: Optional[str] = None
    usage_limit: Optional[int] = None
    active: bool = True

class CouponValidate(BaseModel):
    code: str
    order_total: float

class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1)

class CheckoutCreate(BaseModel):
    email: str
    name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = ""
    city: str
    state: str
    pincode: str
    payment_method: str = "upi"
    coupon_code: Optional[str] = None

class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    title: str
    body: str
    fit_feedback: Optional[str] = ""
