"use client";

import { motion } from "framer-motion";

export function AboutSection() {
  return (
    <section id="about" className="min-h-screen flex items-center justify-center bg-background px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            About Our Project
          </h2>
          <p className="text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto">
            We're passionate about creating sustainable solutions for educational institutions. 
            Our classroom energy saver system combines innovation with practicality to make a real difference.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="bg-primary/5 p-8 md:p-12 rounded-2xl mb-12 border-2 border-primary/20"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-primary mb-6">How It Works</h3>
          <div className="space-y-4 text-foreground/80 text-lg">
            <p>
              Our system uses motion sensors to detect presence in classrooms. When no movement is detected 
              for a set period, the lights automatically turn off, preventing energy waste.
            </p>
            <p>
              For manual control, our system includes easy-to-use switches that allow teachers and staff 
              to override the automatic settings when needed.
            </p>
            <p>
              The result? Significant energy savings, reduced electricity bills, and a smaller carbon footprint 
              for educational institutions.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="p-8 bg-primary/5 rounded-xl border-2 border-primary/20">
            <h4 className="text-xl font-bold text-primary mb-3">Energy Efficient</h4>
            <p className="text-foreground/70">
              Reduces unnecessary electricity consumption by up to 40% in educational facilities.
            </p>
          </div>

          <div className="p-8 bg-primary/5 rounded-xl border-2 border-primary/20">
            <h4 className="text-xl font-bold text-primary mb-3">Cost Effective</h4>
            <p className="text-foreground/70">
              Lower electricity bills with minimal investment in automation infrastructure.
            </p>
          </div>

          <div className="p-8 bg-primary/5 rounded-xl border-2 border-primary/20">
            <h4 className="text-xl font-bold text-primary mb-3">Easy Integration</h4>
            <p className="text-foreground/70">
              Simple installation process that works with existing classroom lighting systems.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
