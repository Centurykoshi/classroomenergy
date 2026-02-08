"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Header } from "@/Components/header";

export default function AboutPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-20">
        <section className="px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
                About Our Project
              </h1>
              <p className="text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto">
                We're passionate about creating sustainable solutions for educational institutions. 
                Our classroom energy saver system combines innovation with practicality to make a real difference.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-primary/5 p-8 md:p-12 rounded-2xl mb-16 border-2 border-primary/20"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">How It Works</h2>
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
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
                Key Features
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div
                  className="p-8 bg-primary/5 rounded-xl border-2 border-primary/20"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-xl font-bold text-primary mb-3">Energy Efficient</h3>
                  <p className="text-foreground/70">
                    Reduces unnecessary electricity consumption by up to 40% in educational facilities.
                  </p>
                </motion.div>

                <motion.div
                  className="p-8 bg-primary/5 rounded-xl border-2 border-primary/20"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-xl font-bold text-primary mb-3">Cost Effective</h3>
                  <p className="text-foreground/70">
                    Lower electricity bills with minimal investment in automation infrastructure.
                  </p>
                </motion.div>

                <motion.div
                  className="p-8 bg-primary/5 rounded-xl border-2 border-primary/20"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-xl font-bold text-primary mb-3">Easy Integration</h3>
                  <p className="text-foreground/70">
                    Simple installation process that works with existing classroom lighting systems.
                  </p>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
                Meet The Team
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                <motion.div
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border-4 border-primary">
                    <Image
                      src="/Poornima.jpeg"
                      alt="Poornima"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Poornima</h3>
                  <p className="text-primary font-semibold mb-3">Project Lead</p>
                  <p className="text-foreground/70">
                    Leading the hardware integration and sensor technology implementation for the project.
                  </p>
                </motion.div>

                <motion.div
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border-4 border-primary">
                    <Image
                      src="/piyush.jpeg"
                      alt="Piyush"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Piyush</h3>
                  <p className="text-primary font-semibold mb-3">Technical Developer</p>
                  <p className="text-foreground/70">
                    Developing the automation systems and software controls for seamless operation.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}
