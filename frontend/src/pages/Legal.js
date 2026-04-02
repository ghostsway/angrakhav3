import { useParams, Link } from 'react-router-dom';

const LEGAL_PAGES = {
  shipping: {
    title: 'Shipping Policy',
    content: [
      { heading: 'Domestic Shipping', body: 'We offer free standard shipping on all orders above Rs 5,000 across India. Standard delivery takes 5-7 business days from the date of dispatch. Express delivery (2-3 business days) is available at an additional charge of Rs 300.' },
      { heading: 'Order Processing', body: 'Orders are processed within 1-2 business days. You will receive a confirmation email with tracking information once your order has been dispatched.' },
      { heading: 'International Shipping', body: 'We ship to select countries internationally. International orders typically arrive within 10-14 business days. Customs duties and import taxes are the responsibility of the buyer.' },
      { heading: 'Packaging', body: 'Every garment is carefully packed in a premium branded box with tissue paper and a garment bag to ensure it arrives in perfect condition.' },
    ]
  },
  returns: {
    title: 'Returns & Exchanges',
    content: [
      { heading: 'Return Policy', body: 'We accept returns within 14 days of delivery for unused items in their original packaging with all tags attached. Items must be unworn, unwashed, and free from any alterations.' },
      { heading: 'Non-Returnable Items', body: 'Custom-made garments, altered pieces, and items marked as final sale are non-returnable. Accessories including pocket squares and stoles are non-returnable for hygiene reasons.' },
      { heading: 'How to Return', body: 'To initiate a return, please contact us at +91 98285 41068. We will arrange a pickup from your address at no additional cost.' },
      { heading: 'Refund Processing', body: 'Refunds are processed within 7 business days of receiving the returned item. The amount will be credited to your original payment method.' },
    ]
  },
  privacy: {
    title: 'Privacy Policy',
    content: [
      { heading: 'Information We Collect', body: 'We collect personal information that you provide directly, including your name, email, phone number, shipping address, and payment information when you make a purchase or create an account.' },
      { heading: 'How We Use Your Information', body: 'Your information is used to process orders, provide customer service, send order updates, and with your consent, share new collections and offers. We never sell your personal data to third parties.' },
      { heading: 'Data Security', body: 'We implement industry-standard security measures to protect your personal information. All payment transactions are encrypted and processed through secure payment gateways.' },
      { heading: 'Cookies', body: 'Our website uses cookies to enhance your browsing experience and remember your preferences. You can manage cookie settings through your browser.' },
    ]
  },
  terms: {
    title: 'Terms of Service',
    content: [
      { heading: 'Acceptance of Terms', body: 'By accessing and using this website, you agree to be bound by these terms. If you do not agree, please do not use our services.' },
      { heading: 'Products & Pricing', body: 'All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise. We reserve the right to modify prices without prior notice. Prices at the time of order placement will be honoured.' },
      { heading: 'Order Acceptance', body: 'Placing an order constitutes an offer to purchase. We reserve the right to accept or decline any order. In case of stock unavailability after order placement, we will notify you and process a full refund.' },
      { heading: 'Intellectual Property', body: 'All content on this website including images, text, designs, and logos are the property of Angarakha and are protected by copyright laws. Unauthorized use is prohibited.' },
    ]
  },
};

export default function Legal() {
  const { page } = useParams();
  const data = LEGAL_PAGES[page];

  if (!data) {
    return (
      <div className="py-20 text-center">
        <h1 className="font-serif text-3xl text-foreground mb-4">Page not found</h1>
        <Link to="/" className="text-sm font-sans text-primary hover:underline">Go home</Link>
      </div>
    );
  }

  return (
    <div className="py-12 lg:py-20" data-testid={`legal-${page}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-4xl sm:text-5xl font-light text-foreground mb-12">{data.title}</h1>
        <div className="space-y-8">
          {data.content.map((section, i) => (
            <div key={i}>
              <h2 className="font-serif text-xl font-light text-foreground mb-3">{section.heading}</h2>
              <p className="text-sm font-sans text-muted-foreground leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-brand-border">
          <p className="text-xs font-sans text-muted-foreground">
            Last updated: March 2026. For questions, contact us at +91 98285 41068 or visit our store.
          </p>
        </div>
      </div>
    </div>
  );
}
