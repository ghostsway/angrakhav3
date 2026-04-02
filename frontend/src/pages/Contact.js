import { useState } from 'react';
import axios from 'axios';
import { MapPin, Clock, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', category: '', occasion: '', preferred_date: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/enquiry`, form);
      toast.success('Enquiry submitted. We will be in touch shortly.');
      setForm({ name: '', email: '', phone: '', category: '', occasion: '', preferred_date: '', message: '' });
    } catch { toast.error('Failed to submit. Please try again.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="py-12 lg:py-20" data-testid="contact-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <p className="text-xs font-sans uppercase tracking-[0.2em] text-primary mb-3">Get In Touch</p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light text-foreground">Contact Us</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Form */}
          <div>
            <h2 className="font-serif text-2xl font-light text-foreground mb-6">Make an Enquiry</h2>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="contact-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" placeholder="Your name *" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="contact-name" />
                <input type="email" placeholder="Email address *" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="contact-email" />
              </div>
              <div>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="contact-category">
                  <option value="">Enquiry category *</option>
                  <option value="product">Product Enquiry</option>
                  <option value="order">Order Status</option>
                  <option value="custom">Custom / Bespoke Order</option>
                  <option value="return">Returns & Exchanges</option>
                  <option value="bulk">Bulk / Wholesale</option>
                  <option value="general">General Question</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="tel" placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="contact-phone" />
                <select value={form.occasion} onChange={e => setForm({...form, occasion: e.target.value})}
                  className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="contact-occasion">
                  <option value="">Select occasion</option>
                  <option value="wedding">Wedding</option>
                  <option value="festive">Festive / Celebration</option>
                  <option value="casual">Casual / Everyday</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <input type="text" placeholder="Preferred date / event (optional)" value={form.preferred_date} onChange={e => setForm({...form, preferred_date: e.target.value})}
                className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="contact-date" />
              <textarea placeholder="Your message *" required rows={5} value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" data-testid="contact-message" />
              <button type="submit" disabled={submitting}
                className="w-full bg-primary text-primary-foreground px-8 py-3 text-xs font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-all disabled:opacity-50"
                data-testid="contact-submit">
                {submitting ? 'Submitting...' : 'Submit Enquiry'}
              </button>
            </form>
          </div>

          {/* Store Info */}
          <div>
            <h2 className="font-serif text-2xl font-light text-foreground mb-6">Our Atelier</h2>
            <div className="aspect-[4/3] mb-8 img-zoom">
              <img src="https://images.unsplash.com/photo-1524227489942-c14a3dc8422c?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" alt="Angarakha Store" className="w-full h-full object-cover" />
            </div>
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary mt-1 shrink-0" />
                <div>
                  <p className="text-xs font-sans uppercase tracking-[0.2em] text-primary mb-1">Address</p>
                  <p className="text-sm font-sans text-muted-foreground">42, Johari Bazaar, Near Hawa Mahal, Jaipur, Rajasthan 302003</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-primary mt-1 shrink-0" />
                <div>
                  <p className="text-xs font-sans uppercase tracking-[0.2em] text-primary mb-1">Hours</p>
                  <p className="text-sm font-sans text-muted-foreground">Mon-Sat: 10:30 AM - 8:00 PM<br />Sun: 11:00 AM - 6:00 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-primary mt-1 shrink-0" />
                <div>
                  <p className="text-xs font-sans uppercase tracking-[0.2em] text-primary mb-1">Phone</p>
                  <a href="tel:+919828541068" className="text-sm font-sans text-muted-foreground hover:text-primary transition-colors">+91 98285 41068</a>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <a href="https://maps.google.com/?q=26.9239,75.8267" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center bg-primary text-primary-foreground px-6 py-3 text-xs font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-all"
                data-testid="contact-maps-btn">
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
