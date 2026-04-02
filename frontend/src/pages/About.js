import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="py-12 lg:py-20" data-testid="about-page">
      {/* Hero */}
      <section className="relative h-[50vh] sm:h-[60vh] flex items-center justify-center overflow-hidden mb-16 lg:mb-24">
        <img src="https://images.unsplash.com/photo-1683140426885-6c0ce899409c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600" alt="Fabric texture" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center px-4">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-xs font-sans uppercase tracking-[0.3em] text-brand-gold mb-4">Est. Jaipur</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light text-white">Our Story</motion.h1>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Origin */}
        <section className="mb-16 lg:mb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <p className="text-xs font-sans uppercase tracking-[0.2em] text-primary mb-4">Heritage</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-foreground mb-6 leading-tight">Born in the Heart of Jaipur</h2>
              <p className="text-base font-sans font-light text-muted-foreground leading-relaxed mb-4">
                Angarakha was born from a simple conviction: that Indian ethnic wear deserves the same quiet confidence that defines the best of global fashion. No excess, no noise — just impeccable craft and thoughtful design.
              </p>
              <p className="text-base font-sans font-light text-muted-foreground leading-relaxed">
                Our atelier sits in the historic lanes of Johari Bazaar, Jaipur, where generations of textile merchants and artisans have shaped India's sartorial identity. This is where we source, design, and bring each garment to life.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="img-zoom aspect-[4/5]">
              <img src="https://images.unsplash.com/photo-1524227489942-c14a3dc8422c?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" alt="Jaipur" className="w-full h-full object-cover" />
            </motion.div>
          </div>
        </section>

        {/* Philosophy */}
        <section className="mb-16 lg:mb-24 bg-brand-surface -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-sans uppercase tracking-[0.2em] text-primary mb-4">Philosophy</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-foreground mb-8">Craft Without Compromise</h2>
            <p className="text-base font-sans font-light text-muted-foreground leading-relaxed mb-6">
              We believe in the dignity of handwork. Every sherwani is hand-embroidered, every kurta hand-woven, every bandhgala hand-tailored. In an age of fast fashion, we choose to move slowly — because craft cannot be hurried.
            </p>
            <p className="text-base font-sans font-light text-muted-foreground leading-relaxed">
              Our fabrics travel from the looms of Banaras, the workshops of Chanderi, and the mills of Italian wool country. We bring them together in Jaipur, where our master tailors shape them into garments that honour both tradition and the wearer's individuality.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16 lg:mb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Artisan First', desc: 'We work directly with weavers and embroiderers, ensuring fair wages and preserving craft traditions that span centuries.' },
              { title: 'Material Integrity', desc: 'Every fabric is selected for quality and provenance. No synthetic shortcuts. No compromises on hand and drape.' },
              { title: 'Modern Heritage', desc: 'Our designs bridge eras — rooted in Indian silhouette traditions, refined for how men dress today.' },
            ].map((val, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="border border-brand-border p-8 text-center">
                <h3 className="font-serif text-xl font-light text-foreground mb-3">{val.title}</h3>
                <p className="text-sm font-sans text-muted-foreground leading-relaxed">{val.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center mb-16">
          <h2 className="font-serif text-2xl sm:text-3xl font-light text-foreground mb-6">Experience Angarakha</h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/collections" className="bg-primary text-primary-foreground px-8 py-3 text-xs font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-all" data-testid="about-cta-collections">
              Explore Collections
            </Link>
            <Link to="/contact" className="border border-primary text-primary px-8 py-3 text-xs font-sans uppercase tracking-[0.2em] hover:bg-primary hover:text-primary-foreground transition-all" data-testid="about-cta-contact">
              Book an Appointment
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
