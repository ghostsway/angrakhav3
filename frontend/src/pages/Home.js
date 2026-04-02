import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Marquee from 'react-fast-marquee';
import axios from 'axios';
import { ArrowDown, MapPin, Clock, Phone, Mail, Send, Sparkles, Truck, CalendarDays } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { toast } from 'sonner';
import TrustBadges from '@/components/TrustBadges';
import RecentlyViewed from '@/components/RecentlyViewed';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SERVICE_ICONS = { 'Styling Assistance': Sparkles, 'Secure Delivery': Truck, 'Private Appointments': CalendarDays };

// Fallback data used only if CMS fetch fails
const FALLBACK_OCCASIONS = [
  { label: 'Wedding', desc: 'Sherwanis, bandhgalas & regal ensembles', to: '/collections/wedding', img: '' },
  { label: 'Festive', desc: 'Kurta sets & Jodhpuris for celebrations', to: '/collections/festive', img: '' },
  { label: 'Casual', desc: 'Handloom kurtas & relaxed ethnics', to: '/collections/casual', img: '' },
  { label: 'All Occasions', desc: 'Explore our complete collection', to: '/collections/all', img: '' },
];

export default function Home() {
  const [enquiry, setEnquiry] = useState({ name: '', phone: '', occasion: '', preferred_date: '', message: '' });
  const [newsletter, setNewsletter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { items: recentItems } = useRecentlyViewed();

  // CMS-driven content
  const [hero, setHero] = useState(null);
  const [brandStory, setBrandStory] = useState(null);
  const [storeDetails, setStoreDetails] = useState(null);
  const [services, setServices] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    // Fetch all CMS blocks + collections in parallel
    Promise.allSettled([
      axios.get(`${API}/cms/hero`),
      axios.get(`${API}/cms/brand_story`),
      axios.get(`${API}/cms/store_details`),
      axios.get(`${API}/cms/services`),
      axios.get(`${API}/cms/testimonials`),
      axios.get(`${API}/cms/faqs`),
      axios.get(`${API}/collections`),
    ]).then(([heroR, storyR, storeR, svcR, testR, faqR, colR]) => {
      if (heroR.status === 'fulfilled') setHero(heroR.value.data);
      if (storyR.status === 'fulfilled') setBrandStory(storyR.value.data);
      if (storeR.status === 'fulfilled') setStoreDetails(storeR.value.data);
      if (svcR.status === 'fulfilled') setServices(svcR.value.data.items || []);
      if (testR.status === 'fulfilled') setTestimonials(testR.value.data.items || []);
      if (faqR.status === 'fulfilled') setFaqs(faqR.value.data.items || []);
      if (colR.status === 'fulfilled') {
        const cols = colR.value.data.collections || [];
        const tiles = cols.filter(c => c.featured).map(c => ({
          label: c.name, desc: c.description,
          to: `/collections/${c.slug}`, img: c.hero_image || ''
        }));
        setCollections(tiles.length > 0 ? tiles : FALLBACK_OCCASIONS);
      }
    });
  }, []);

  const handleEnquiry = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/enquiry`, enquiry);
      toast.success('Enquiry submitted successfully. We will be in touch.');
      setEnquiry({ name: '', phone: '', occasion: '', preferred_date: '', message: '' });
    } catch { toast.error('Failed to submit. Please try again.'); }
    finally { setSubmitting(false); }
  };

  const handleNewsletter = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/newsletter`, { email: newsletter });
      toast.success(res.data.status === 'already_subscribed' ? 'You are already subscribed.' : 'Welcome to the Angarakha circle.');
      setNewsletter('');
    } catch { toast.error('Failed to subscribe.'); }
  };

  const heroTitle = hero?.title || 'The Art of Dressing Well';
  const heroSubtitle = hero?.subtitle || 'Handcrafted Indian menswear from the heart of Jaipur';
  const heroImage = hero?.image || 'https://images.pexels.com/photos/6687174/pexels-photo-6687174.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1080&w=1920';

  return (
    <div data-testid="home-page">
      {/* ─── Hero ─── */}
      <section className="relative h-[100vh] flex items-center justify-center overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Angarakha" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-3xl">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xs font-sans uppercase tracking-[0.3em] text-brand-gold mb-6">
            Handcrafted in Jaipur
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
            className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light text-white tracking-tight leading-[1.1]">
            {heroTitle.includes(' ') ? <>{heroTitle.split(/(?<=\s\w+$)/)[0]}<br />{heroTitle.split(/(?<=\s\w+$)/)[1] || ''}</> : heroTitle}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-6 text-base font-sans font-light text-white/80 max-w-lg mx-auto leading-relaxed">
            {heroSubtitle}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#occasion" className="inline-flex items-center justify-center bg-primary text-primary-foreground px-8 py-3 text-xs font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-all duration-300" data-testid="hero-cta-shop">
              Shop by Occasion
            </a>
            <a href="#contact" className="inline-flex items-center justify-center border border-white/40 text-white px-8 py-3 text-xs font-sans uppercase tracking-[0.2em] hover:bg-white/10 transition-all duration-300" data-testid="hero-cta-enquiry">
              Make an Enquiry
            </a>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <ArrowDown className="w-5 h-5 text-white/50 animate-bounce" />
        </motion.div>
      </section>

      {/* ─── Marquee ─── */}
      <div className="py-4 border-y border-brand-border bg-brand-bg">
        <Marquee speed={30} gradient={false}>
          <span className="marquee-text mx-12">Handcrafted in Jaipur</span>
          <span className="marquee-text mx-12">Bespoke Tailoring</span>
          <span className="marquee-text mx-12">Heritage Wear</span>
          <span className="marquee-text mx-12">Ceremonial Luxury</span>
          <span className="marquee-text mx-12">Artisan Embroidery</span>
          <span className="marquee-text mx-12">Since Generations</span>
        </Marquee>
      </div>

      {/* ─── Shop by Occasion ─── */}
      <section id="occasion" className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" data-testid="occasion-section">
        <div className="text-center mb-12 lg:mb-16">
          <p className="text-xs font-sans uppercase tracking-[0.2em] text-primary mb-3">Curated For You</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-foreground">Shop by Occasion</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
          {collections.map((tile, i) => (
            <motion.div key={tile.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
              <Link to={tile.to} className="group block relative aspect-[4/3] sm:aspect-[3/2] overflow-hidden bg-brand-surface"
                data-testid={`occasion-tile-${tile.label.toLowerCase().replace(/\s/g, '-')}`}>
                {tile.img && <img src={tile.img} alt={tile.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                  <h3 className="font-serif text-2xl lg:text-3xl font-light text-white mb-1">{tile.label}</h3>
                  <p className="text-sm font-sans text-white/70 max-w-xs">{tile.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Brand Story ─── */}
      {brandStory && (
        <section className="py-16 lg:py-24 bg-brand-surface" data-testid="brand-story-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                <p className="text-xs font-sans uppercase tracking-[0.2em] text-primary mb-4">Our Heritage</p>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-foreground mb-6 leading-tight">{brandStory.title || 'Rooted in Craft'}</h2>
                <p className="text-base font-sans font-light text-muted-foreground leading-relaxed mb-8 whitespace-pre-line">{brandStory.body}</p>
                <Link to="/about" className="inline-flex items-center text-xs font-sans uppercase tracking-[0.2em] text-primary hover:text-foreground transition-colors" data-testid="brand-story-cta">
                  Read Our Story <span className="ml-2">&rarr;</span>
                </Link>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
                className="img-zoom aspect-[4/5]">
                <img src={brandStory.image} alt="Atelier" className="w-full h-full object-cover" />
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Services ─── */}
      {services.length > 0 && (
        <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" data-testid="services-section">
          <div className="text-center mb-12">
            <p className="text-xs font-sans uppercase tracking-[0.2em] text-primary mb-3">The Angarakha Experience</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-foreground">At Your Service</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {services.map((svc, i) => {
              const Icon = SERVICE_ICONS[svc.title] || Sparkles;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-brand-surface border border-brand-border p-8 text-center" data-testid={`service-card-${i}`}>
                  <Icon className="w-6 h-6 text-primary mx-auto mb-4" strokeWidth={1.5} />
                  <h3 className="font-serif text-xl font-light text-foreground mb-3">{svc.title}</h3>
                  <p className="text-sm font-sans text-muted-foreground leading-relaxed">{svc.description}</p>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Testimonials ─── */}
      {testimonials.length > 0 && (
        <section className="py-16 lg:py-24 bg-brand-surface" data-testid="testimonials-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-xs font-sans uppercase tracking-[0.2em] text-primary mb-3">Voices</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-foreground">What Our Patrons Say</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {testimonials.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="border border-brand-border p-8 bg-brand-bg" data-testid={`testimonial-${i}`}>
                  <p className="font-serif text-lg font-light text-foreground leading-relaxed italic mb-6">"{t.quote}"</p>
                  <div>
                    <p className="text-sm font-sans font-medium text-foreground">{t.name}</p>
                    <p className="text-xs font-sans text-muted-foreground">{t.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Store Details ─── */}
      {storeDetails && (
        <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" data-testid="store-section">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="img-zoom aspect-[4/3]">
              <img src={storeDetails.image} alt="Angarakha Store" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-xs font-sans uppercase tracking-[0.2em] text-primary mb-4">Visit Us</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-foreground mb-8">Our Jaipur Store</h2>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary mt-1 shrink-0" />
                  <p className="text-sm font-sans text-muted-foreground">{storeDetails.address}</p>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-primary mt-1 shrink-0" />
                  <p className="text-sm font-sans text-muted-foreground whitespace-pre-line">{storeDetails.timings}</p>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-primary mt-1 shrink-0" />
                  <a href={`tel:${storeDetails.phone}`} className="text-sm font-sans text-muted-foreground hover:text-primary transition-colors">{storeDetails.phone}</a>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={storeDetails.map_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-primary text-primary-foreground px-6 py-3 text-xs font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-all" data-testid="open-maps-btn">
                  Open in Maps
                </a>
                <Link to="/contact" className="inline-flex items-center justify-center border border-primary text-primary px-6 py-3 text-xs font-sans uppercase tracking-[0.2em] hover:bg-primary hover:text-primary-foreground transition-all" data-testid="book-appointment-btn">
                  Book Appointment
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── FAQ ─── */}
      {faqs.length > 0 && (
        <section className="py-16 lg:py-24 bg-brand-surface" data-testid="faq-section">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-xs font-sans uppercase tracking-[0.2em] text-primary mb-3">Questions</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-foreground">Frequently Asked</h2>
            </div>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-brand-border bg-brand-bg px-6" data-testid={`faq-item-${i}`}>
                  <AccordionTrigger className="font-serif text-base font-light text-foreground hover:no-underline py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm font-sans text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* ─── Contact / Enquiry ─── */}
      <section id="contact" className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto" data-testid="contact-section">
        <div className="text-center mb-12">
          <p className="text-xs font-sans uppercase tracking-[0.2em] text-primary mb-3">Get In Touch</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-foreground">Make an Enquiry</h2>
        </div>
        <form onSubmit={handleEnquiry} className="space-y-5" data-testid="enquiry-form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <input type="text" placeholder="Your name" required value={enquiry.name} onChange={e => setEnquiry({...enquiry, name: e.target.value})}
              className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="enquiry-name" />
            <input type="tel" placeholder="Phone number" required value={enquiry.phone} onChange={e => setEnquiry({...enquiry, phone: e.target.value})}
              className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="enquiry-phone" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <select value={enquiry.occasion} onChange={e => setEnquiry({...enquiry, occasion: e.target.value})}
              className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="enquiry-occasion">
              <option value="">Select occasion</option>
              <option value="wedding">Wedding</option>
              <option value="festive">Festive / Celebration</option>
              <option value="casual">Casual / Everyday</option>
              <option value="other">Other</option>
            </select>
            <input type="text" placeholder="Preferred date / event (optional)" value={enquiry.preferred_date} onChange={e => setEnquiry({...enquiry, preferred_date: e.target.value})}
              className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="enquiry-date" />
          </div>
          <textarea placeholder="Your message" required rows={4} value={enquiry.message} onChange={e => setEnquiry({...enquiry, message: e.target.value})}
            className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" data-testid="enquiry-message" />
          <button type="submit" disabled={submitting}
            className="w-full bg-primary text-primary-foreground px-8 py-3 text-xs font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-all disabled:opacity-50" data-testid="enquiry-submit">
            {submitting ? 'Submitting...' : 'Submit Enquiry'}
          </button>
        </form>
      </section>

      {/* ─── Trust Badges ─── */}
      <section className="py-12 lg:py-16 border-t border-brand-border" data-testid="trust-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TrustBadges />
        </div>
      </section>

      {/* ─── Recently Viewed ─── */}
      <RecentlyViewed items={recentItems} />

      {/* ─── Newsletter ─── */}
      <section className="py-16 lg:py-20 bg-brand-surface border-t border-brand-border" data-testid="newsletter-section">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-sans uppercase tracking-[0.2em] text-primary mb-3">Stay Updated</p>
          <h2 className="font-serif text-2xl sm:text-3xl font-light text-foreground mb-3">Join the Angarakha Circle</h2>
          <p className="text-sm font-sans text-muted-foreground mb-8">New collections, styling tips and exclusive updates. No spam, ever.</p>
          <form onSubmit={handleNewsletter} className="flex gap-2" data-testid="newsletter-form">
            <input type="email" placeholder="Your email address" required value={newsletter} onChange={e => setNewsletter(e.target.value)}
              className="flex-1 bg-brand-bg border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="newsletter-email" />
            <button type="submit" className="bg-primary text-primary-foreground px-6 py-3 text-xs font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-all" data-testid="newsletter-submit">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
