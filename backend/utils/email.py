import os
import asyncio
import logging

logger = logging.getLogger(__name__)

# ─── Resend Email Setup ────────────────────────────────────────────────────────
try:
    import resend
    RESEND_ENABLED = os.getenv('RESEND_API_KEY') and os.getenv('RESEND_API_KEY') != 'your_resend_api_key'
    
    if RESEND_ENABLED:
        resend.api_key = os.getenv('RESEND_API_KEY')
        SENDER_EMAIL = os.getenv('SENDER_EMAIL', 'onboarding@resend.dev')
        logger.info("✓ Resend email service initialized successfully")
    else:
        SENDER_EMAIL = 'onboarding@resend.dev'
        logger.warning("⚠ Resend API key not configured - email notifications will be mocked")
except Exception as e:
    RESEND_ENABLED = False
    SENDER_EMAIL = 'onboarding@resend.dev'
    logger.warning(f"⚠ Resend not available: {e}")


async def send_order_confirmation_email(order_data):
    """Send order confirmation email to customer"""
    try:
        # Format order items for email
        items_html = ""
        for item in order_data['items']:
            items_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <strong>{item['name']}</strong><br/>
                    <span style="color: #666; font-size: 14px;">Size: {item['size']} | Qty: {item['quantity']}</span>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹{item['price']:,}</td>
            </tr>
            """
        
        # Format delivery address
        addr = order_data['shipping_address']
        address_html = f"""
        {order_data['customer_name']}<br/>
        {addr['line1']}<br/>
        {addr['line2'] + '<br/>' if addr.get('line2') else ''}
        {addr['city']}, {addr['state']} - {addr['pincode']}<br/>
        Phone: {order_data['phone']}
        """
        
        # Create HTML email
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                            <!-- Header -->
                            <tr>
                                <td style="background-color: #1a1a1a; padding: 30px; text-align: center;">
                                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; letter-spacing: 4px; font-weight: 300;">ANGARAKHA</h1>
                                </td>
                            </tr>
                            
                            <!-- Success Message -->
                            <tr>
                                <td style="padding: 40px 30px 20px; text-align: center;">
                                    <div style="display: inline-block; width: 60px; height: 60px; background-color: #22c55e; border-radius: 50%; line-height: 60px;">
                                        <span style="color: white; font-size: 30px;">✓</span>
                                    </div>
                                    <h2 style="margin: 20px 0 10px; color: #1a1a1a; font-size: 24px;">Order Confirmed!</h2>
                                    <p style="margin: 0; color: #666; font-size: 16px;">Thank you for your purchase</p>
                                </td>
                            </tr>
                            
                            <!-- Order Number -->
                            <tr>
                                <td style="padding: 0 30px 30px; text-align: center;">
                                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; display: inline-block;">
                                        <p style="margin: 0 0 5px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
                                        <p style="margin: 0; color: #1a1a1a; font-size: 20px; font-family: monospace; font-weight: bold;">{order_data['order_number']}</p>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Order Items -->
                            <tr>
                                <td style="padding: 0 30px 20px;">
                                    <h3 style="margin: 0 0 15px; color: #1a1a1a; font-size: 18px;">Order Items</h3>
                                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #eee;">
                                        {items_html}
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Order Summary -->
                            <tr>
                                <td style="padding: 0 30px 20px;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="padding: 5px 0; color: #666;">Subtotal</td>
                                            <td style="padding: 5px 0; text-align: right;">₹{order_data['subtotal']:,}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 5px 0; color: #666;">Tax (18%)</td>
                                            <td style="padding: 5px 0; text-align: right;">₹{order_data['tax']:,}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 5px 0; color: #666;">Shipping</td>
                                            <td style="padding: 5px 0; text-align: right;">₹{order_data['shipping']:,}</td>
                                        </tr>
                                        <tr style="border-top: 2px solid #1a1a1a;">
                                            <td style="padding: 10px 0 0; font-weight: bold; font-size: 18px;">Total</td>
                                            <td style="padding: 10px 0 0; text-align: right; font-weight: bold; font-size: 18px; color: #1a1a1a;">₹{order_data['total']:,}</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Delivery Address -->
                            <tr>
                                <td style="padding: 20px 30px; background-color: #f9f9f9;">
                                    <h3 style="margin: 0 0 10px; color: #1a1a1a; font-size: 16px;">Delivery Address</h3>
                                    <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">
                                        {address_html}
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Payment Info -->
                            <tr>
                                <td style="padding: 20px 30px;">
                                    <h3 style="margin: 0 0 10px; color: #1a1a1a; font-size: 16px;">Payment Information</h3>
                                    <p style="margin: 0 0 5px; color: #666; font-size: 14px;">Payment Method: <strong>{order_data['payment_method'].upper()}</strong></p>
                                    <p style="margin: 0 0 5px; color: #666; font-size: 14px;">Payment Status: <strong style="color: #22c55e;">{order_data['payment_status'].upper()}</strong></p>
                                    <p style="margin: 0; color: #666; font-size: 14px;">Order Status: <strong>{order_data['status'].upper()}</strong></p>
                                </td>
                            </tr>
                            
                            <!-- What's Next -->
                            <tr>
                                <td style="padding: 20px 30px; background-color: #f9f9f9;">
                                    <h3 style="margin: 0 0 10px; color: #1a1a1a; font-size: 16px;">What's Next?</h3>
                                    <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px; line-height: 1.8;">
                                        <li>We'll send you tracking details once your order is shipped</li>
                                        <li>Expected delivery: 5-7 business days</li>
                                        <li>Questions? Contact us at +91 98285 41068</li>
                                    </ul>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="padding: 30px; text-align: center; background-color: #1a1a1a;">
                                    <p style="margin: 0 0 10px; color: #ffffff; font-size: 24px; letter-spacing: 3px; font-weight: 300;">ANGARAKHA</p>
                                    <p style="margin: 0; color: #999; font-size: 12px;">
                                        Building No. 11, Ghee Walo Ka Rasta, Johri Bazar, Jaipur-302001<br/>
                                        Phone: +91 98285 41068 | Daily: 10:30 AM - 9:30 PM
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        if RESEND_ENABLED:
            params = {
                "from": SENDER_EMAIL,
                "to": [order_data['email']],
                "subject": f"Order Confirmation - {order_data['order_number']} | Angarakha",
                "html": html_content
            }
            
            # Run sync SDK in thread to keep FastAPI non-blocking
            email_result = await asyncio.to_thread(resend.Emails.send, params)
            logger.info(f"✓ Order confirmation email sent to {order_data['email']} - ID: {email_result.get('id')}")
            return True
        else:
            logger.info(f"[MOCK EMAIL] Would send order confirmation to {order_data['email']}")
            return False
            
    except Exception as e:
        logger.error(f"✗ Failed to send order confirmation email: {e}")
        return False

async def send_abandoned_cart_email(email, name, items):
    """Send abandoned cart recovery email"""
    try:
        if not RESEND_ENABLED:
            logger.info(f"[MOCK EMAIL] Abandoned cart reminder to {email}")
            return False
        items_html = ""
        for item in items:
            items_html += f"""<tr><td style="padding:10px;border-bottom:1px solid #eee;">
                <strong>{item.get('name','')}</strong><br/>
                <span style="color:#666;font-size:14px;">Size: {item.get('size','')} | Qty: {item.get('quantity',1)}</span>
            </td><td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">Rs {item.get('price',0):,}</td></tr>"""
        total = sum(i.get("price",0)*i.get("quantity",1) for i in items)
        html = f"""<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px;"><tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:#1a1a1a;padding:30px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:32px;letter-spacing:4px;">ANGARAKHA</h1></td></tr>
        <tr><td style="padding:40px 30px;text-align:center;"><h2 style="color:#1a1a1a;font-size:24px;">You left something behind!</h2>
        <p style="color:#666;">Hi {name or 'there'}, your cart is waiting for you.</p></td></tr>
        <tr><td style="padding:0 30px 20px;"><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;">{items_html}</table>
        <p style="text-align:right;font-size:18px;font-weight:bold;margin-top:15px;">Total: Rs {total:,}</p></td></tr>
        <tr><td style="padding:20px 30px;text-align:center;">
        <p style="color:#666;">Complete your purchase before these items sell out!</p></td></tr>
        <tr><td style="padding:30px;text-align:center;background:#1a1a1a;">
        <p style="margin:0;color:#fff;font-size:24px;letter-spacing:3px;">ANGARAKHA</p></td></tr>
        </table></td></tr></table></body></html>"""
        params = {"from": SENDER_EMAIL, "to": [email], "subject": "You left items in your cart! | Angarakha", "html": html}
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Abandoned cart email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send abandoned cart email: {e}")
        return False
