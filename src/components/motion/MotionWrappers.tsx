import { motion, type HTMLMotionProps } from "framer-motion";
import { type ReactNode } from "react";

// Page transition wrapper
export const PageTransition = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
  >
    {children}
  </motion.div>
);

// Staggered container — wraps children that animate in sequence
export const StaggerContainer = ({
  children,
  className,
  delay = 0,
  staggerDelay = 0.06,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  staggerDelay?: number;
}) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={{
      hidden: {},
      visible: {
        transition: {
          delayChildren: delay,
          staggerChildren: staggerDelay,
        },
      },
    }}
  >
    {children}
  </motion.div>
);

// Stagger child item
export const StaggerItem = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 16 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
      },
    }}
  >
    {children}
  </motion.div>
);

// Hover-lift card wrapper
export const HoverCard = ({
  children,
  className,
  ...props
}: { children: ReactNode; className?: string } & Omit<HTMLMotionProps<"div">, "children">) => (
  <motion.div
    className={className}
    whileHover={{ y: -3, boxShadow: "0 14px 40px rgba(0,0,0,0.09)" }}
    transition={{ duration: 0.2, ease: "easeOut" }}
    {...props}
  >
    {children}
  </motion.div>
);

// Scale-on-tap for buttons
export const TapScale = ({
  children,
  className,
  ...props
}: { children: ReactNode; className?: string } & Omit<HTMLMotionProps<"div">, "children">) => (
  <motion.div
    className={className}
    whileTap={{ scale: 0.97 }}
    whileHover={{ scale: 1.02 }}
    transition={{ duration: 0.15 }}
    {...props}
  >
    {children}
  </motion.div>
);

// Fade-in section (for scroll-triggered or delayed sections)
export const FadeInSection = ({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) => (
  <motion.section
    className={className}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
  >
    {children}
  </motion.section>
);
