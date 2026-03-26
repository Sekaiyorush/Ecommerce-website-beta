import { Shield, Clock, Award, FlaskConical } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';

export function TrustFeatures() {
  const features = [
    {
      icon: Shield,
      title: '99% Purity Guaranteed',
      description: 'Every batch is third-party tested (HPLC/MS) to ensure highest research standards.',
    },
    {
      icon: Clock,
      title: 'Fast & Secure Shipping',
      description: 'Discreet packaging with same-day shipping on orders placed before 2PM EST.',
    },
    {
      icon: Award,
      title: 'Expert Research Support',
      description: 'Dedicated team of specialists available to help with dosage guidance and product selection.',
    },
    {
      icon: FlaskConical,
      title: 'Laboratory Certified',
      description: 'All products manufactured in ISO-certified facilities with strict quality control.',
    },
  ];

  /* Stagger container variants */
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <section className="py-24 bg-card relative">
      <div className="container max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1 }}
          className="mb-20 flex flex-col md:flex-row md:items-end justify-between border-b border-[#D4AF37]/10 pb-8 gap-6"
        >
          <div>
            <span className="text-[10px] font-bold text-[#AA771C] uppercase tracking-[0.3em] mb-4 block">
              Why Choose Us
            </span>
            <h2 className="text-4xl md:text-5xl font-serif text-foreground tracking-tight">
              The Golden Standard
            </h2>
          </div>
          <p className="max-w-md text-xs text-muted-foreground uppercase tracking-widest leading-relaxed">
            Uncompromising quality control and precision manufacturing for the world's leading research institutions.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-16"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group relative"
            >
              {/* Animated line on hover */}
              <div className="absolute -left-6 top-0 w-[1px] h-0 bg-gradient-to-b from-[#D4AF37] to-transparent transition-all duration-700 group-hover:h-full opacity-0 group-hover:opacity-100 hidden md:block" />

              {/* Icon */}
              <div className="w-12 h-12 border border-[#D4AF37]/30 flex items-center justify-center mb-6 group-hover:border-[#D4AF37] transition-colors duration-500 bg-card relative overflow-hidden">
                <div className="absolute inset-0 bg-[#D4AF37]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <feature.icon className="h-5 w-5 text-[#AA771C] relative z-10" strokeWidth={1.5} />
              </div>

              {/* Content */}
              <h3 className="font-serif text-xl text-foreground mb-4 group-hover:text-[#AA771C] transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed uppercase tracking-wider">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
