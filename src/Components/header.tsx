"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function Header() {
    return (
        <motion.header
            className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/10"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <nav className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <Link href="/" className="text-2xl font-bold text-primary">
                        Energy Saver
                    </Link>

                    <div className="flex items-center gap-8">
                        <motion.a
                            href="/"
                            className="text-foreground hover:text-primary transition-colors font-medium"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Home
                        </motion.a>

                        <motion.a
                            href="/about"
                            className="text-foreground hover:text-primary transition-colors font-medium"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            About
                        </motion.a>

                        <motion.a
                            href="/Login"
                            className="text-foreground hover:text-primary transition-colors font-medium"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Login
                        </motion.a>

                        <motion.a
                            href="/Signup"
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Sign Up
                        </motion.a>
                    </div>
                </div>
            </nav>
        </motion.header>
    );
}
