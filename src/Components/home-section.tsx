"use client";

import { motion } from "framer-motion";

export function HomeSection() {
  return (
    <section id="home" className="min-h-screen flex items-center justify-center bg-background px-6 pt-20">
      <div className="max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="text-5xl md:text-7xl font-bold text-foreground mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Classroom Energy Saver
          </motion.h1>
          
          <motion.p
            className="text-xl md:text-2xl text-foreground/80 mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Smart automation to turn off lights when classrooms are empty. 
            Save energy, reduce costs, and help the environment.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <motion.a
              href="#about"
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Learn More
            </motion.a>
            <motion.button
              className="px-8 py-3 border-2 border-foreground text-foreground rounded-lg text-lg font-semibold hover:bg-foreground hover:text-background transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <motion.div
            className="p-6 rounded-lg border-2 border-foreground/10"
            whileHover={{ y: -5, borderColor: "var(--primary)" }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-2xl font-bold text-primary mb-3">Manual Control</h3>
            <p className="text-foreground/70">
              Simple switches and controls to manually manage classroom lighting when needed.
            </p>
          </motion.div>

          <motion.div
            className="p-6 rounded-lg border-2 border-foreground/10"
            whileHover={{ y: -5, borderColor: "var(--primary)" }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-2xl font-bold text-primary mb-3">Automatic Detection</h3>
            <p className="text-foreground/70">
              Smart sensors detect when classrooms are empty and automatically turn off lights.
            </p>
          </motion.div>

          <motion.div
            className="p-6 rounded-lg border-2 border-foreground/10"
            whileHover={{ y: -5, borderColor: "var(--primary)" }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-2xl font-bold text-primary mb-3">Energy Savings</h3>
            <p className="text-foreground/70">
              Reduce electricity waste and lower costs while helping the environment.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
