import os
import logging
import requests

logger = logging.getLogger(__name__)

# ─── Telegram Bot Setup ───────────────────────────────────────────────────────
try:
    TELEGRAM_ENABLED = all([
        os.getenv('TELEGRAM_BOT_TOKEN'),
        os.getenv('TELEGRAM_CHAT_ID')
    ]) and os.getenv('TELEGRAM_BOT_TOKEN') != 'your_telegram_bot_token'
    
    if TELEGRAM_ENABLED:
        logger.info("✓ Telegram Bot initialized successfully")
    else:
        logger.warning("⚠ Telegram credentials not configured - notifications will be mocked")
except Exception as e:
    TELEGRAM_ENABLED = False
    logger.warning(f"⚠ Telegram not available: {e}")

# ─── Razorpay Setup ────────────────────────────────────────────────────────────
try:
    import razorpay
    RAZORPAY_ENABLED = all([
        os.getenv('RAZORPAY_KEY_ID'),
        os.getenv('RAZORPAY_KEY_SECRET')
    ]) and os.getenv('RAZORPAY_KEY_ID') != 'your_razorpay_key_id'
    
    if RAZORPAY_ENABLED:
        razorpay_client = razorpay.Client(auth=(
            os.getenv('RAZORPAY_KEY_ID'),
            os.getenv('RAZORPAY_KEY_SECRET')
        ))
        logger.info("✓ Razorpay initialized successfully")
    else:
        logger.warning("⚠ Razorpay credentials not configured - using mock mode")
except Exception as e:
    RAZORPAY_ENABLED = False
    logger.warning(f"⚠ Razorpay not available: {e}")

import asyncio

async def send_order_notification_telegram(order_data):
    """Send Telegram notification when a new order is placed"""
    try:
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN', 'your_telegram_bot_token')
        chat_id = os.getenv('TELEGRAM_CHAT_ID', 'your_chat_id')
        
        # Format order items
        items_text = ""
        for idx, item in enumerate(order_data['items'], 1):
            items_text += f"\n{idx}. *{item['name']}*"
            items_text += f"\n   Size: {item['size']} | Qty: {item['quantity']} | Price: ₹{item['price']:,}"
        
        # Format delivery address
        addr = order_data['shipping_address']
        address_text = f"{addr['line1']}"
        if addr.get('line2'):
            address_text += f", {addr['line2']}"
        address_text += f"\n{addr['city']}, {addr['state']} - {addr['pincode']}"
        
        # Create formatted Telegram message
        message = f"""🛍️ *NEW ORDER RECEIVED*

📋 *Order:* `{order_data['order_number']}`

👤 *Customer Details:*
Name: {order_data['customer_name']}
Phone: {order_data['phone']}

📦 *Items Ordered:*{items_text}

💰 *Payment Summary:*
Subtotal: ₹{order_data['subtotal']:,}
Tax (18%): ₹{order_data['tax']:,}
Shipping: ₹{order_data['shipping']:,}
*TOTAL: ₹{order_data['total']:,}*
Payment: {order_data['payment_method'].upper()}

📍 *Delivery Address:*
{address_text}

✅ Status: {order_data['status'].upper()}
💳 Payment: {order_data['payment_status'].upper()}"""
        
        if TELEGRAM_ENABLED:
            url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            payload = {
                "chat_id": chat_id,
                "text": message,
                "parse_mode": "Markdown"
            }
            response = await asyncio.to_thread(requests.post, url, json=payload, timeout=10)
            
            if response.status_code == 200:
                logger.info(f"✓ Telegram notification sent successfully to chat {chat_id}")
                return True
            else:
                logger.error(f"✗ Telegram API error: {response.status_code} - {response.text}")
                return False
        else:
            logger.info(f"[MOCK TELEGRAM] Would send to chat {chat_id}:")
            logger.info(message)
            return False
            
    except Exception as e:
        logger.error(f"✗ Failed to send Telegram notification: {e}")
        return False
