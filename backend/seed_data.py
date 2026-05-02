import logging
from datetime import datetime, timezone
from database import db

logger = logging.getLogger(__name__)

IMG_HERO = "https://images.pexels.com/photos/6687174/pexels-photo-6687174.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1080&w=1920"
IMG_SHERWANI1 = "https://images.pexels.com/photos/6458310/pexels-photo-6458310.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=500"
IMG_SHERWANI2 = "https://images.pexels.com/photos/6687174/pexels-photo-6687174.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=500"
IMG_WEDDING = "https://images.unsplash.com/photo-1762709413447-15781dbc08f7?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"
IMG_KURTA1 = "https://images.unsplash.com/photo-1767775498862-d4740ce574ce?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"
IMG_FESTIVE = "https://images.unsplash.com/photo-1774267230662-575d1f4ec1bd?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"
IMG_ARCH = "https://images.unsplash.com/photo-1524227489942-c14a3dc8422c?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
IMG_TEXTURE = "https://images.unsplash.com/photo-1683140426885-6c0ce899409c?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
IMG_GOLD = "https://images.pexels.com/photos/2248589/pexels-photo-2248589.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"

SEED_PRODUCTS = [
    {
        "product_id": "prod_001", "name": "Royal Ivory Sherwani", "slug": "royal-ivory-sherwani",
        "short_description": "Hand-embroidered ivory sherwani with antique zardozi work",
        "description": "A masterpiece of ceremonial dressing. This ivory sherwani features intricate zardozi embroidery on the collar, sleeves and hem. Crafted from premium raw silk with a satin lining for all-day comfort. Paired best with churidar or dhoti for a regal wedding look.",
        "price": 45000, "compare_price": 52000, "images": [IMG_SHERWANI1, IMG_SHERWANI2, IMG_GOLD],
        "category": "sherwani", "fabric": "Raw Silk", "color": "Ivory", "fit": "Tailored",
        "occasions": ["wedding"], "sizes": ["S", "M", "L", "XL", "XXL"],
        "tags": ["wedding", "sherwani", "bestseller", "new"], "in_stock": True, "featured": True,
        "care": "Dry clean only. Store in garment bag.", "lining": "Satin",
        "size_stock": {"S": 5, "M": 8, "L": 10, "XL": 6, "XXL": 3},
        "badges": ["bestseller", "new"],
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "product_id": "prod_002", "name": "Midnight Indigo Sherwani", "slug": "midnight-indigo-sherwani",
        "short_description": "Deep indigo sherwani with subtle thread work and velvet trim",
        "description": "A contemporary take on the classic sherwani. Deep indigo dupion silk body with velvet lapels and hand-stitched thread work along the placket. The slim silhouette and mandarin collar lend a modern edge while honouring traditional craftsmanship.",
        "price": 38000, "compare_price": 44000, "images": [IMG_SHERWANI2, IMG_SHERWANI1, IMG_TEXTURE],
        "category": "sherwani", "fabric": "Dupion Silk", "color": "Indigo", "fit": "Slim",
        "occasions": ["wedding", "festive"], "sizes": ["S", "M", "L", "XL"],
        "tags": ["wedding", "sherwani", "new"], "in_stock": True, "featured": True,
        "size_stock": {"S": 3, "M": 7, "L": 6, "XL": 4},
        "badges": ["new"],
        "care": "Dry clean only. Store away from direct sunlight.",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "product_id": "prod_003", "name": "Champagne Zari Sherwani", "slug": "champagne-zari-sherwani",
        "short_description": "Champagne gold sherwani with all-over Banarasi zari weave",
        "description": "Woven by master artisans of Banaras, this champagne sherwani showcases an all-over zari brocade pattern. The structured silhouette with padded shoulders creates a commanding presence. Includes matching stole.",
        "price": 52000, "compare_price": 62000, "images": [IMG_GOLD, IMG_SHERWANI1, IMG_WEDDING],
        "category": "sherwani", "fabric": "Banarasi Brocade", "color": "Gold", "fit": "Regular",
        "occasions": ["wedding"], "sizes": ["M", "L", "XL", "XXL"],
        "tags": ["wedding", "sherwani", "premium"], "in_stock": True, "featured": True,
        "size_stock": {"M": 4, "L": 5, "XL": 3, "XXL": 2},
        "badges": ["bestseller"],
        "care": "Dry clean only. Keep in muslin cover. Avoid folding on zari work.",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "product_id": "prod_004", "name": "Chanderi Silk Kurta", "slug": "chanderi-silk-kurta",
        "short_description": "Lightweight Chanderi silk kurta with delicate butti pattern",
        "description": "The Chanderi silk kurta is a celebration of India's weaving heritage. Lightweight and breathable, the fabric features a subtle butti pattern woven into the silk. Perfect for festive gatherings and sangeet evenings.",
        "price": 12500, "compare_price": 15000, "images": [IMG_KURTA1, IMG_FESTIVE, IMG_TEXTURE],
        "category": "kurta", "fabric": "Chanderi Silk", "color": "Powder Blue", "fit": "Relaxed",
        "occasions": ["festive", "casual"], "sizes": ["S", "M", "L", "XL", "XXL"],
        "tags": ["festive", "kurta", "new"], "in_stock": True, "featured": True,
        "size_stock": {"S": 8, "M": 12, "L": 10, "XL": 6, "XXL": 4},
        "badges": ["new"],
        "care": "Gentle hand wash in cold water or dry clean. Air dry in shade.",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "product_id": "prod_005", "name": "Handloom Cotton Kurta", "slug": "handloom-cotton-kurta",
        "short_description": "Organic handloom cotton kurta for everyday elegance",
        "description": "Woven on traditional pit looms in Rajasthan, this cotton kurta brings artisanal character to daily wear. The natural texture and breathability make it ideal for warm Jaipur days and relaxed festive brunches.",
        "price": 6800, "compare_price": 8500, "images": [IMG_FESTIVE, IMG_KURTA1, IMG_ARCH],
        "category": "kurta", "fabric": "Handloom Cotton", "color": "Ecru", "fit": "Relaxed",
        "occasions": ["casual"], "sizes": ["S", "M", "L", "XL", "XXL"],
        "tags": ["casual", "kurta", "everyday"], "in_stock": True, "featured": False,
        "size_stock": {"S": 10, "M": 15, "L": 12, "XL": 8, "XXL": 5},
        "badges": [],
        "care": "Machine washable. Gentle cycle with similar colours.",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "product_id": "prod_006", "name": "Banarasi Brocade Kurta Set", "slug": "banarasi-brocade-kurta-set",
        "short_description": "Complete festive set with Banarasi kurta, churidar and dupatta",
        "description": "A head-to-toe festive ensemble. The kurta features rich Banarasi brocade with gold thread work, paired with a matching churidar and woven dupatta. Designed for Diwali celebrations, pujas and family gatherings.",
        "price": 18500, "compare_price": 22000, "images": [IMG_GOLD, IMG_FESTIVE, IMG_SHERWANI1],
        "category": "kurta", "fabric": "Banarasi Silk", "color": "Burgundy", "fit": "Regular",
        "occasions": ["festive", "wedding"], "sizes": ["S", "M", "L", "XL"],
        "tags": ["festive", "kurta", "set", "new"], "in_stock": True, "featured": True,
        "size_stock": {"S": 5, "M": 8, "L": 7, "XL": 4},
        "badges": ["new"],
        "care": "Dry clean recommended. Store flat to preserve brocade.",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "product_id": "prod_007", "name": "Classic Black Bandhgala", "slug": "classic-black-bandhgala",
        "short_description": "Timeless black bandhgala suit in Italian wool blend",
        "description": "The quintessential gentleman's garment. This bandhgala is cut from a premium Italian wool blend with a satin-lined interior. The structured shoulders and high collar create a sharp, distinguished silhouette suited for receptions, awards and formal dinners.",
        "price": 28000, "compare_price": 34000, "images": [IMG_SHERWANI2, IMG_TEXTURE, IMG_SHERWANI1],
        "category": "bandhgala", "fabric": "Wool Blend", "color": "Black", "fit": "Tailored",
        "occasions": ["wedding", "festive"], "sizes": ["S", "M", "L", "XL", "XXL"],
        "tags": ["wedding", "festive", "bandhgala", "bestseller"], "in_stock": True, "featured": True,
        "size_stock": {"S": 6, "M": 10, "L": 8, "XL": 5, "XXL": 3},
        "badges": ["bestseller"],
        "care": "Dry clean only. Hang on padded hanger to maintain shape.",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "product_id": "prod_008", "name": "Navy Wool Bandhgala", "slug": "navy-wool-bandhgala",
        "short_description": "Versatile navy bandhgala for formal and festive occasions",
        "description": "A modern bandhgala in deep navy wool with subtle herringbone texture. Versatile enough for board rooms and baraat alike. Features a hidden placket, functioning cuff buttons and dual vents for ease of movement.",
        "price": 22000, "compare_price": 26000, "images": [IMG_SHERWANI1, IMG_ARCH, IMG_SHERWANI2],
        "category": "bandhgala", "fabric": "Wool", "color": "Navy", "fit": "Slim",
        "occasions": ["festive", "casual"], "sizes": ["M", "L", "XL"],
        "tags": ["festive", "casual", "bandhgala"], "in_stock": True, "featured": False,
        "size_stock": {"M": 7, "L": 5, "XL": 2},
        "badges": [],
        "care": "Dry clean only. Use cedar blocks to prevent moths.",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "product_id": "prod_009", "name": "Heritage Jodhpuri Jacket", "slug": "heritage-jodhpuri-jacket",
        "short_description": "Signature Jodhpuri jacket with hand-embroidered crest detailing",
        "description": "Inspired by the royal courts of Jodhpur, this jacket features a unique asymmetric closure and hand-embroidered crest on the breast pocket. Crafted from premium cotton-silk blend with a polished brass button detail.",
        "price": 35000, "compare_price": 42000, "images": [IMG_WEDDING, IMG_SHERWANI1, IMG_GOLD],
        "category": "jodhpuri", "fabric": "Cotton-Silk Blend", "color": "Maroon", "fit": "Tailored",
        "occasions": ["wedding", "festive"], "sizes": ["S", "M", "L", "XL"],
        "tags": ["wedding", "jodhpuri", "premium", "new"], "in_stock": True, "featured": True,
        "size_stock": {"S": 3, "M": 5, "L": 4, "XL": 2},
        "badges": ["new"],
        "care": "Dry clean only. Store in garment bag.",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "product_id": "prod_010", "name": "Sage Green Jodhpuri Set", "slug": "sage-green-jodhpuri-set",
        "short_description": "Complete Jodhpuri set in sage green with matching trousers",
        "description": "A fresh take on the Jodhpuri silhouette. The sage green jacket is paired with matching high-waisted trousers and a silk pocket square. The subtle tonal embroidery on the collar adds a refined finish.",
        "price": 32000, "compare_price": 38000, "images": [IMG_FESTIVE, IMG_KURTA1, IMG_WEDDING],
        "category": "jodhpuri", "fabric": "Silk Blend", "color": "Sage Green", "fit": "Regular",
        "occasions": ["festive", "wedding"], "sizes": ["S", "M", "L", "XL", "XXL"],
        "tags": ["festive", "jodhpuri", "set"], "in_stock": True, "featured": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "product_id": "prod_011", "name": "Embroidered Nehru Jacket", "slug": "embroidered-nehru-jacket",
        "short_description": "Versatile Nehru jacket with subtle threadwork embroidery",
        "description": "Layer this Nehru jacket over a plain kurta or a crisp shirt for an instant festive upgrade. The all-over threadwork in tonal colours creates texture without being loud. Lined in soft soft cotton for comfort.",
        "price": 15000, "compare_price": 18000, "images": [IMG_SHERWANI1, IMG_FESTIVE, IMG_TEXTURE],
        "category": "nehru_jacket", "fabric": "Cotton Silk", "color": "Beige", "fit": "Regular",
        "occasions": ["festive", "casual"], "sizes": ["S", "M", "L", "XL", "XXL"],
        "tags": ["festive", "casual", "nehru_jacket", "new"], "in_stock": True, "featured": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "product_id": "prod_012", "name": "Ivory Festive Kurta Set", "slug": "ivory-festive-kurta-set",
        "short_description": "Elegant ivory kurta-pyjama set with gold accents",
        "description": "An essential in every man's ethnic wardrobe. This ivory kurta features delicate gold gota patti work on the neckline and cuffs. Comes with matching straight-cut pyjamas. Ideal for haldi ceremonies, pujas and family celebrations.",
        "price": 16500, "compare_price": 20000, "images": [IMG_KURTA1, IMG_GOLD, IMG_FESTIVE],
        "category": "kurta", "fabric": "Modal Silk", "color": "Ivory", "fit": "Relaxed",
        "occasions": ["festive", "wedding"], "sizes": ["S", "M", "L", "XL"],
        "tags": ["festive", "kurta", "set", "bestseller"], "in_stock": True, "featured": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
]

SEED_COLLECTIONS = [
    {"collection_id": "col_001", "name": "Wedding", "slug": "wedding", "description": "Timeless ensembles for the most important day. From opulent sherwanis to regal bandhgalas.", "hero_image": IMG_WEDDING, "occasion_tags": ["wedding"], "featured": True, "sort_order": 1},
    {"collection_id": "col_002", "name": "Festive", "slug": "festive", "description": "Celebrate Diwali, Eid, and every occasion in between with distinguished style.", "hero_image": IMG_FESTIVE, "occasion_tags": ["festive"], "featured": True, "sort_order": 2},
    {"collection_id": "col_003", "name": "Casual", "slug": "casual", "description": "Elevated everyday ethnics. Handloom kurtas and relaxed silhouettes for the modern gentleman.", "hero_image": IMG_KURTA1, "occasion_tags": ["casual"], "featured": True, "sort_order": 3},
    {"collection_id": "col_004", "name": "New Arrivals", "slug": "new-arrivals", "description": "The latest additions to our atelier. Fresh silhouettes, timeless craft.", "hero_image": IMG_TEXTURE, "occasion_tags": [], "featured": True, "sort_order": 4},
    {"collection_id": "col_005", "name": "Sherwanis", "slug": "sherwanis", "description": "The crown of ceremonial dressing. Each sherwani is a testament to generations of embroidery craft.", "hero_image": IMG_SHERWANI1, "occasion_tags": ["wedding"], "featured": False, "sort_order": 5},
    {"collection_id": "col_006", "name": "All Products", "slug": "all", "description": "Explore our complete collection of handcrafted Indian menswear.", "hero_image": IMG_ARCH, "occasion_tags": [], "featured": True, "sort_order": 6},
]

SEED_CMS = [
    {"key": "hero", "title": "The Art of Dressing Well", "subtitle": "Traditional and modern clothing from the heart of Jaipur", "image": IMG_HERO},
    {"key": "brand_story", "title": "Rooted in Craft", "body": "Located in the vibrant Johri Bazar of Jaipur, Angarakha offers a diverse range of traditional and modern ethnic wear. Every thread is chosen with intention, every stitch placed by artisan hands that have perfected their craft over generations. We believe ceremonial dressing should feel as natural as it looks — confident, unhurried, unmistakably yours.", "image": IMG_ARCH},
    {"key": "store_details", "address": "Building No. 11, Ghee Walo Ka Rasta, Johri Bazar, Jaipur-302001, Rajasthan", "phone": "+91 98285 41068", "email": "", "timings": "Daily: 10:30 AM – 9:30 PM", "map_url": "https://maps.google.com/?q=26.9239,75.8267", "image": IMG_ARCH},
    {"key": "services", "items": [
        {"title": "Styling Assistance", "description": "Our style consultants help you find the right ensemble for your occasion, body type and personal taste."},
        {"title": "Secure Delivery", "description": "Every garment is packed with care. Free shipping on orders above Rs 5,000."},
        {"title": "Visit Our Store", "description": "Visit our store in Johri Bazar for a truly personal shopping experience."}
    ]},
    {"key": "testimonials", "items": [
        {"quote": "The sherwani I wore on my wedding day was unlike anything I had ever seen. The craftsmanship was impeccable.", "name": "Arjun Mehta", "role": "Groom, Jaipur"},
        {"quote": "I ordered a bandhgala for my brother's reception. The fit was perfect and the fabric quality was outstanding.", "name": "Priya Sharma", "role": "Sister of the Groom, Delhi"},
        {"quote": "Finally, an Indian menswear brand that understands modern aesthetics without losing heritage.", "name": "Kabir Rathore", "role": "Fashion Consultant, Mumbai"},
        {"quote": "The Jodhpuri jacket I purchased has become my go-to for every formal event. Truly versatile.", "name": "Vikram Singh", "role": "Entrepreneur, Udaipur"}
    ]},
    {"key": "faqs", "items": [
        {"question": "What is your shipping policy?", "answer": "We offer free shipping on all orders above Rs 5,000 across India. Standard delivery takes 5-7 business days. Express delivery (2-3 days) is available at an additional charge."},
        {"question": "Do you offer alterations?", "answer": "Yes. All garments can be altered for a perfect fit. First alteration is complimentary within 14 days of delivery. Visit our Jaipur store or ship the garment back to us."},
        {"question": "How do I find my size?", "answer": "Each product page includes a detailed size guide with measurements in inches and centimetres. If you are between sizes, our styling team is available via WhatsApp to help."},
        {"question": "What is your return policy?", "answer": "We accept returns within 14 days of delivery for unused items in original packaging. Custom and altered pieces are non-returnable. Refunds are processed within 7 business days."},
        {"question": "Can I book a private appointment?", "answer": "Absolutely. Use our contact form or call us directly to schedule a private session at our Jaipur atelier. We recommend booking at least 48 hours in advance."},
        {"question": "Do you ship internationally?", "answer": "Yes. We ship to select countries. International orders typically arrive within 10-14 business days. Customs duties are the responsibility of the buyer."}
    ]}
]

SEED_REVIEWS = [
    {"review_id": "rev_001", "product_slug": "royal-ivory-sherwani", "user_id": "seed", "user_name": "Rajesh K.", "rating": 5, "title": "Absolutely stunning", "body": "Wore this for my wedding and received countless compliments. The embroidery work is incredible.", "fit_feedback": "True to size", "created_at": datetime.now(timezone.utc).isoformat()},
    {"review_id": "rev_002", "product_slug": "royal-ivory-sherwani", "user_id": "seed", "user_name": "Amit P.", "rating": 4, "title": "Premium quality", "body": "Excellent fabric and stitching. Slightly heavy but expected for this level of work.", "fit_feedback": "Slightly large", "created_at": datetime.now(timezone.utc).isoformat()},
    {"review_id": "rev_003", "product_slug": "classic-black-bandhgala", "user_id": "seed", "user_name": "Nikhil S.", "rating": 5, "title": "My new go-to formal", "body": "The fit is impeccable. I have worn this to three events already and it always impresses.", "fit_feedback": "True to size", "created_at": datetime.now(timezone.utc).isoformat()},
    {"review_id": "rev_004", "product_slug": "chanderi-silk-kurta", "user_id": "seed", "user_name": "Karan M.", "rating": 5, "title": "Light and elegant", "body": "Perfect for Jaipur summers. The Chanderi silk feels like air on the skin.", "fit_feedback": "True to size", "created_at": datetime.now(timezone.utc).isoformat()},
]

async def seed_database():
    count = await db.products.count_documents({})
    if count == 0:
        logger.info("Seeding database with initial data...")
        await db.products.insert_many(SEED_PRODUCTS)
        await db.collections.insert_many(SEED_COLLECTIONS)
        for block in SEED_CMS:
            await db.cms.insert_one(block)
        await db.reviews.insert_many(SEED_REVIEWS)
        logger.info(f"Seeded {len(SEED_PRODUCTS)} products, {len(SEED_COLLECTIONS)} collections, {len(SEED_CMS)} CMS blocks, {len(SEED_REVIEWS)} reviews")
    else:
        logger.info(f"Database already has {count} products, skipping seed.")
