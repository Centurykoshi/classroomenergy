"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { authClient } from "@/lib/authclient";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { LogOut, LayoutDashboard, User } from "lucide-react";
import { useRouter } from "next/navigation";

export function Header() {
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();

    const handleLogout = async () => {
        await authClient.signOut();
        router.push("/");
    };

    const getInitials = (name?: string | null, email?: string | null) => {
        if (name) {
            return name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
        }
        if (email) {
            return email.slice(0, 2).toUpperCase();
        }
        return "U";
    };

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

                        {isPending ? (
                            <div className="h-9 w-9 animate-pulse bg-muted rounded-full" />
                        ) : session?.user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <motion.button
                                        className="flex items-center gap-2 focus:outline-none"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Avatar className="h-9 w-9 border-2 border-primary/20 hover:border-primary/50 transition-colors">
                                            <AvatarImage
                                                src={session.user.image || undefined}
                                                alt={session.user.name || "User"}
                                            />
                                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                                {getInitials(session.user.name, session.user.email)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </motion.button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {session.user.name || "User"}
                                            </p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {session.user.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard" className="cursor-pointer">
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            <span>Dashboard</span>
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleLogout}
                                        className="cursor-pointer text-red-600 focus:text-red-600"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>
                </div>
            </nav>
        </motion.header>
    );
}
