import { Link } from 'react-router-dom';
import { useDatabase } from '@/context/DatabaseContext';
import { SEO } from '@/components/SEO';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

const drawVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
        pathLength: 1,
        opacity: 0.4,
        transition: {
            pathLength: { delay: 0.8, type: "spring" as const, duration: 4.5, bounce: 0 },
            opacity: { delay: 0.8, duration: 2 }
        }
    }
};

const KingPiece = () => (
    <motion.svg
        viewBox="0 0 100 200"
        className="w-full h-full drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]"
        initial="hidden"
        animate="visible"
    >
        <defs>
            <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D4AF37" />
                <stop offset="50%" stopColor="#F3E5AB" />
                <stop offset="100%" stopColor="#AA771C" />
            </linearGradient>
        </defs>
        <motion.g stroke="url(#gold-grad)" strokeWidth="1" fill="none">
            {/* Base */}
            <motion.path d="M 20 180 L 80 180 L 75 165 L 25 165 Z" variants={drawVariants} />
            <motion.path d="M 25 165 L 75 165 L 70 155 L 30 155 Z" variants={drawVariants} />
            {/* Stem */}
            <motion.path d="M 30 155 C 45 130, 45 90, 40 70" variants={drawVariants} />
            <motion.path d="M 70 155 C 55 130, 55 90, 60 70" variants={drawVariants} />
            {/* Collar */}
            <motion.path d="M 35 70 L 65 70 L 60 60 L 40 60 Z" variants={drawVariants} />
            {/* Crown */}
            <motion.path d="M 40 60 L 30 35 L 43 45 L 50 25 L 57 45 L 70 35 L 60 60" strokeLinejoin="round" variants={drawVariants} />
            {/* Cross */}
            <motion.path d="M 50 25 L 50 5 M 43 12 L 57 12" strokeLinecap="round" variants={drawVariants} />
            {/* Jewels/Dots */}
            <motion.circle cx="30" cy="35" r="1.5" variants={drawVariants} />
            <motion.circle cx="70" cy="35" r="1.5" variants={drawVariants} />
            <motion.circle cx="50" cy="5" r="1.5" variants={drawVariants} />
        </motion.g>
    </motion.svg>
);

const QueenPiece = () => (
    <motion.svg
        viewBox="0 0 100 200"
        className="w-full h-full drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]"
        initial="hidden"
        animate="visible"
    >
        <defs>
            <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D4AF37" />
                <stop offset="50%" stopColor="#F3E5AB" />
                <stop offset="100%" stopColor="#AA771C" />
            </linearGradient>
        </defs>
        <motion.g stroke="url(#gold-grad)" strokeWidth="1" fill="none">
            {/* Base */}
            <motion.path d="M 20 180 L 80 180 L 75 165 L 25 165 Z" variants={drawVariants} />
            <motion.path d="M 25 165 L 75 165 L 70 155 L 30 155 Z" variants={drawVariants} />
            {/* Stem */}
            <motion.path d="M 30 155 C 40 120, 30 100, 42 70" variants={drawVariants} />
            <motion.path d="M 70 155 C 60 120, 70 100, 58 70" variants={drawVariants} />
            {/* Collar */}
            <motion.path d="M 35 70 L 65 70 L 60 60 L 40 60 Z" variants={drawVariants} />
            {/* Crown */}
            <motion.path d="M 40 60 L 25 35 L 38 45 L 44 25 L 50 40 L 56 25 L 62 45 L 75 35 L 60 60" strokeLinejoin="round" variants={drawVariants} />
            {/* Jewels/Dots */}
            <motion.circle cx="25" cy="35" r="1.5" variants={drawVariants} />
            <motion.circle cx="44" cy="25" r="1.5" variants={drawVariants} />
            <motion.circle cx="56" cy="25" r="1.5" variants={drawVariants} />
            <motion.circle cx="75" cy="35" r="1.5" variants={drawVariants} />
            <motion.circle cx="50" cy="40" r="1.5" variants={drawVariants} />
        </motion.g>
    </motion.svg>
);

// Pre-generate floating gold particles at module level (avoids Math.random during render)
const PARTICLES = Array.from({ length: 10 }).map((_, i) => ({
    id: i,
    size: (i * 3.7 + 1.2) % 4 + 1,          // deterministic pseudo-random: 1..5
    x: (i * 17.3 + 5) % 100,                 // spread across 0..100
    y: (i * 23.7 + 10) % 100,
    duration: (i * 2.3 + 15) % 15 + 15,      // 15..30
    delay: (i * 1.1) % 5,                     // 0..5
}));

export function LandingPage() {
    const { db } = useDatabase();
    const { companyName, companyDescription } = db.siteSettings;
    const { scrollY } = useScroll();
    const ySpring = useSpring(scrollY, { stiffness: 40, damping: 20 });
    const yTitle = useTransform(ySpring, [0, 500], [0, 150]);

    const particles = PARTICLES;

    return (
        <div className="min-h-screen bg-background flex flex-col relative overflow-hidden font-sans">
            <SEO title="Golden Tier Peptide | Premium Research Compounds" description="Premium research-grade peptides with supreme purity. Invitation-only platform for verified researchers and partners." />

            {/* Dynamic Gold Particles Background */}
            <div className="absolute inset-0 pointer-events-none z-0">
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        className="absolute rounded-full bg-gradient-to-br from-[#D4AF37] to-[#AA771C] opacity-30 dark:opacity-40 shadow-[0_0_8px_rgba(212,175,55,0.6)] dark:shadow-[0_0_12px_rgba(212,175,55,0.5)]"
                        style={{
                            width: p.size,
                            height: p.size,
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                        }}
                        animate={{
                            y: ["0vh", "-100vh"],
                            x: ["0vw", `${((p.id * 7.3 + 3) % 20) - 10}vw`],
                            opacity: [0, 0.4, 0],
                        }}
                        transition={{
                            duration: p.duration,
                            repeat: Infinity,
                            ease: "linear",
                            delay: p.delay,
                        }}
                    />
                ))}
            </div>

            {/* Subtle background glow - theme aware */}
            <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.03)_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.08)_0%,_transparent_60%)]" />

            {/* King and Queen Animations */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex justify-between items-center px-[5%] md:px-[10%] lg:px-[15%]">
                <motion.div
                    className="w-32 md:w-48 lg:w-64 h-auto opacity-70 hidden sm:block"
                    animate={{ y: [0, -20, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                >
                    <KingPiece />
                </motion.div>
                <motion.div
                    className="w-32 md:w-48 lg:w-64 h-auto opacity-70 hidden sm:block"
                    animate={{ y: [0, -20, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                >
                    <QueenPiece />
                </motion.div>
            </div>

            {/* Header - Ultra Minimal */}
            <header className="relative z-20 flex items-center justify-between px-8 py-10 w-full max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="text-sm font-bold tracking-[0.3em] uppercase text-gold-primary"
                >
                    {companyName}
                </motion.div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                    className="flex items-center space-x-8"
                >
                    <Link
                        to="/login"
                        className="text-xs font-semibold tracking-widest uppercase text-muted-foreground hover:text-gold-500 transition-colors duration-500"
                    >
                        Sign In
                    </Link>
                    <Link
                        to="/register"
                        className="relative px-6 py-2 text-xs font-semibold tracking-widest uppercase text-white bg-[#111] dark:bg-gold-500 dark:text-slate-900 overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent -translate-x-[150%] animate-[shimmer_3s_infinite]" />
                        <span className="relative z-10">Register</span>
                        {/* Animated Gold Bottom Border on Hover */}
                        <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] dark:from-slate-900 dark:to-slate-800 transition-all duration-500 ease-out group-hover:w-full" />
                    </Link>
                </motion.div>
            </header>

            {/* Hero Section - Extreme Negative Space */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">

                {/* Animated Accent Line */}
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 60 }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                    className="w-[1px] bg-gradient-to-b from-transparent via-[#D4AF37] to-transparent mb-12"
                />

                <motion.div
                    style={{ y: yTitle }}
                    className="max-w-6xl mx-auto text-center"
                >
                    {/* Main Title - Shiny Gold Gradient */}
                    <motion.h1
                        initial={{ opacity: 0, y: 40, filter: "blur(20px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
                        className="text-[5rem] sm:text-[8rem] lg:text-[11rem] font-serif tracking-tighter leading-[0.85] text-gold-gradient pb-6"
                    >
                        Absolute.
                        <br />
                        Purity.
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 2, delay: 1.2 }}
                        className="mt-16 relative"
                    >
                        <div className="absolute left-1/2 -translate-x-1/2 -top-8 w-12 h-[1px] bg-gold-gradient opacity-50" />
                        <p className="text-sm md:text-lg font-light tracking-[0.4em] text-muted-foreground max-w-2xl mx-auto leading-relaxed uppercase">
                            {companyDescription}
                        </p>
                    </motion.div>

                    {/* Luxury CTA Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 1.5 }}
                        className="mt-24 flex justify-center"
                    >
                        <Link
                            to="/login"
                            className="group relative flex flex-col items-center justify-center w-40 h-40 rounded-full border border-gold-300/20 dark:border-gold-400/30 hover:border-gold-500 transition-all duration-1000 mx-auto"
                        >
                            {/* Rotating glowing arc */}
                            <div className="absolute inset-[-2px] rounded-full bg-gold-gradient opacity-0 group-hover:opacity-100 animate-spin-slow transition-opacity duration-1000" />
                            <div className="absolute inset-[1px] rounded-full bg-background z-0" />

                            <span className="relative z-10 text-[10px] font-bold tracking-[0.4em] uppercase text-gold-gradient group-hover:scale-110 transition-transform duration-700 text-center">
                                ENTER <br /><span className="mt-2 block opacity-50 group-hover:opacity-100 transition-opacity">DOMAIN</span>
                            </span>
                        </Link>
                    </motion.div>
                </motion.div>
            </main>

            {/* Footer - Bare Minimum */}
            <footer className="relative z-20 text-center py-12 px-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2, delay: 1.5 }}
                    className="flex flex-col items-center justify-center space-y-4"
                >
                    <div className="w-[1px] h-12 bg-gradient-to-b from-gold-500/50 to-transparent" />
                    <p className="text-[10px] font-medium tracking-widest text-gold-muted uppercase">
                        © {new Date().getFullYear()} {companyName}
                    </p>
                </motion.div>
            </footer>
        </div>
    );
}
