"""
Angarakha E-commerce API Tests
Tests for: Search, Filters, Gift Cards, Products, Collections, Cart, Reviews, Newsletter
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSearchAPIs:
    """Search autocomplete, filters, and popular searches"""
    
    def test_search_autocomplete_with_query(self):
        """Test autocomplete returns suggestions for 'sher'"""
        response = requests.get(f"{BASE_URL}/api/search/autocomplete?q=sher")
        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data
        assert len(data["suggestions"]) > 0
        # Verify suggestion structure
        suggestion = data["suggestions"][0]
        assert "name" in suggestion
        assert "slug" in suggestion
        assert "price" in suggestion
        assert "sherwani" in suggestion["name"].lower() or "sher" in suggestion["name"].lower()
    
    def test_search_autocomplete_short_query(self):
        """Test autocomplete returns empty for short queries"""
        response = requests.get(f"{BASE_URL}/api/search/autocomplete?q=a")
        assert response.status_code == 200
        data = response.json()
        assert data["suggestions"] == []
    
    def test_search_filters(self):
        """Test filter options endpoint"""
        response = requests.get(f"{BASE_URL}/api/search/filters")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert "fabrics" in data
        assert "colors" in data
        assert "occasions" in data
        assert "sizes" in data
        assert "price_range" in data
        assert "min" in data["price_range"]
        assert "max" in data["price_range"]
        # Verify we have actual data
        assert len(data["categories"]) > 0
        assert len(data["sizes"]) > 0
    
    def test_search_popular(self):
        """Test popular searches endpoint"""
        response = requests.get(f"{BASE_URL}/api/search/popular")
        assert response.status_code == 200
        data = response.json()
        assert "popular" in data
        assert len(data["popular"]) > 0
        # Verify structure
        item = data["popular"][0]
        assert "term" in item
        assert "slug" in item


class TestGiftCardAPIs:
    """Gift card purchase and validation"""
    
    def test_purchase_gift_card(self):
        """Test creating a gift card"""
        payload = {
            "amount": 2500,
            "recipient_name": "TEST_Recipient",
            "recipient_email": "test_recipient@example.com",
            "sender_name": "TEST_Sender",
            "message": "Test gift card message"
        }
        response = requests.post(f"{BASE_URL}/api/giftcards/purchase", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "giftcard_id" in data
        assert "code" in data
        assert data["amount"] == 2500
        assert data["balance"] == 2500
        assert data["status"] == "active"
        assert data["code"].startswith("ANG-")
        # Store code for next test
        TestGiftCardAPIs.created_code = data["code"]
    
    def test_check_valid_gift_card(self):
        """Test checking a valid gift card"""
        code = getattr(TestGiftCardAPIs, 'created_code', None)
        if not code:
            pytest.skip("No gift card created in previous test")
        response = requests.post(f"{BASE_URL}/api/giftcards/check", json={"code": code})
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["balance"] == 2500
        assert data["code"] == code
    
    def test_check_invalid_gift_card(self):
        """Test checking an invalid gift card"""
        response = requests.post(f"{BASE_URL}/api/giftcards/check", json={"code": "INVALID-CODE-123"})
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data


class TestProductAPIs:
    """Product listing and detail endpoints"""
    
    def test_list_products(self):
        """Test product listing"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert "total" in data
        assert len(data["products"]) > 0
        # Verify product structure
        product = data["products"][0]
        assert "product_id" in product
        assert "name" in product
        assert "slug" in product
        assert "price" in product
        assert "images" in product
    
    def test_list_products_with_filters(self):
        """Test product listing with occasion filter"""
        response = requests.get(f"{BASE_URL}/api/products?occasion=wedding")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
    
    def test_get_product_by_slug(self):
        """Test getting single product by slug"""
        response = requests.get(f"{BASE_URL}/api/products/royal-ivory-sherwani")
        assert response.status_code == 200
        data = response.json()
        assert data["slug"] == "royal-ivory-sherwani"
        assert "name" in data
        assert "price" in data
        assert "description" in data
        # Check for new fields
        assert "care" in data or "lining" in data  # Care instructions
    
    def test_get_product_not_found(self):
        """Test 404 for non-existent product"""
        response = requests.get(f"{BASE_URL}/api/products/non-existent-product-xyz")
        assert response.status_code == 404


class TestCollectionAPIs:
    """Collection listing and detail endpoints"""
    
    def test_list_collections(self):
        """Test collection listing"""
        response = requests.get(f"{BASE_URL}/api/collections")
        assert response.status_code == 200
        data = response.json()
        assert "collections" in data
        assert len(data["collections"]) > 0
    
    def test_get_collection_by_slug(self):
        """Test getting collection with products"""
        response = requests.get(f"{BASE_URL}/api/collections/wedding")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert "total" in data


class TestReviewAPIs:
    """Product review endpoints"""
    
    def test_get_reviews_for_product(self):
        """Test getting reviews for a product"""
        response = requests.get(f"{BASE_URL}/api/reviews/royal-ivory-sherwani")
        assert response.status_code == 200
        data = response.json()
        assert "reviews" in data
        assert "average_rating" in data
        assert "total" in data
    
    def test_create_review_requires_auth(self):
        """Test that creating review requires authentication"""
        payload = {
            "rating": 5,
            "title": "Great product",
            "body": "Loved it!",
            "fit_feedback": "true_to_size"
        }
        response = requests.post(f"{BASE_URL}/api/reviews/royal-ivory-sherwani", json=payload)
        assert response.status_code == 401


class TestNewsletterAPI:
    """Newsletter subscription"""
    
    def test_subscribe_newsletter(self):
        """Test newsletter subscription"""
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(f"{BASE_URL}/api/newsletter", json={"email": unique_email})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["subscribed", "already_subscribed"]
    
    def test_subscribe_duplicate(self):
        """Test duplicate subscription returns already_subscribed"""
        email = "duplicate_test@example.com"
        # First subscription
        requests.post(f"{BASE_URL}/api/newsletter", json={"email": email})
        # Second subscription
        response = requests.post(f"{BASE_URL}/api/newsletter", json={"email": email})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "already_subscribed"


class TestCartAPIs:
    """Cart operations (guest mode)"""
    
    def test_get_cart_without_token(self):
        """Test getting cart without guest token returns empty"""
        response = requests.get(f"{BASE_URL}/api/cart")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
    
    def test_add_to_cart_requires_token(self):
        """Test adding to cart requires guest token or auth"""
        payload = {
            "product_id": "prod_001",
            "product_slug": "royal-ivory-sherwani",
            "name": "Royal Ivory Sherwani",
            "image": "https://example.com/image.jpg",
            "size": "M",
            "price": 45000,
            "quantity": 1
        }
        response = requests.post(f"{BASE_URL}/api/cart/items", json=payload)
        assert response.status_code == 400


class TestWishlistAPIs:
    """Wishlist operations (requires auth)"""
    
    def test_get_wishlist_requires_auth(self):
        """Test wishlist requires authentication"""
        response = requests.get(f"{BASE_URL}/api/wishlist")
        assert response.status_code == 401
    
    def test_add_to_wishlist_requires_auth(self):
        """Test adding to wishlist requires authentication"""
        response = requests.post(f"{BASE_URL}/api/wishlist/prod_001")
        assert response.status_code == 401
    
    def test_check_wishlist_returns_false_for_guest(self):
        """Test wishlist check returns false for unauthenticated user"""
        response = requests.get(f"{BASE_URL}/api/wishlist/check/prod_001")
        assert response.status_code == 200
        data = response.json()
        assert data["in_wishlist"] == False


class TestReferralAPIs:
    """Referral program endpoints"""
    
    def test_get_referral_requires_auth(self):
        """Test getting referral code requires auth"""
        response = requests.get(f"{BASE_URL}/api/referral")
        assert response.status_code == 401
    
    def test_apply_referral_invalid_code(self):
        """Test applying invalid referral code"""
        response = requests.post(f"{BASE_URL}/api/referral/apply", json={"code": "INVALID123"})
        assert response.status_code == 404


class TestAddressAPIs:
    """Address management (requires auth)"""
    
    def test_get_addresses_requires_auth(self):
        """Test getting addresses requires authentication"""
        response = requests.get(f"{BASE_URL}/api/addresses")
        assert response.status_code == 401


class TestReturnsAPIs:
    """Returns/exchange endpoints"""
    
    def test_get_returns_requires_auth(self):
        """Test getting returns requires authentication"""
        response = requests.get(f"{BASE_URL}/api/returns")
        assert response.status_code == 401
    
    def test_create_return_requires_auth(self):
        """Test creating return requires authentication"""
        payload = {
            "order_id": "order_123",
            "reason": "Size issue",
            "type": "exchange"
        }
        response = requests.post(f"{BASE_URL}/api/returns", json=payload)
        assert response.status_code == 401


class TestCouponAPIs:
    """Coupon validation"""
    
    def test_validate_invalid_coupon(self):
        """Test validating non-existent coupon"""
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "INVALID_COUPON",
            "order_total": 10000
        })
        assert response.status_code == 404


class TestPaymentAPIs:
    """Payment endpoints (mocked)"""
    
    def test_create_payment_order(self):
        """Test creating payment order (mocked)"""
        response = requests.post(f"{BASE_URL}/api/payment/create-order", json={"amount": 50000})
        assert response.status_code == 200
        data = response.json()
        assert "order_id" in data
        assert data["mock"] == True
    
    def test_verify_payment(self):
        """Test payment verification (mocked)"""
        response = requests.post(f"{BASE_URL}/api/payment/verify", json={"payment_id": "pay_123"})
        assert response.status_code == 200
        data = response.json()
        assert data["verified"] == True
        assert data["mock"] == True


class TestCMSAPIs:
    """CMS content endpoints"""
    
    def test_get_hero_cms(self):
        """Test getting hero CMS block"""
        response = requests.get(f"{BASE_URL}/api/cms/hero")
        assert response.status_code == 200
        data = response.json()
        assert "key" in data
    
    def test_get_cms_not_found(self):
        """Test 404 for non-existent CMS block"""
        response = requests.get(f"{BASE_URL}/api/cms/non_existent_block")
        assert response.status_code == 404


class TestAdminAPIs:
    """Admin endpoints (require admin auth)"""
    
    def test_admin_analytics_requires_auth(self):
        """Test admin analytics requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics")
        assert response.status_code == 401
    
    def test_admin_inventory_requires_auth(self):
        """Test admin inventory requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/inventory")
        assert response.status_code == 401
    
    def test_admin_returns_requires_auth(self):
        """Test admin returns requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/returns")
        assert response.status_code == 401
    
    def test_admin_abandoned_carts_requires_auth(self):
        """Test admin abandoned carts requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/abandoned-carts")
        assert response.status_code == 401
    
    def test_admin_giftcards_requires_auth(self):
        """Test admin gift cards requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/giftcards")
        assert response.status_code == 401
    
    def test_admin_referrals_requires_auth(self):
        """Test admin referrals requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/referrals")
        assert response.status_code == 401


class TestSearchMainEndpoint:
    """Main search endpoint"""
    
    def test_search_products(self):
        """Test main search endpoint"""
        response = requests.get(f"{BASE_URL}/api/search?q=kurta")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert "total" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
