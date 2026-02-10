"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/authclient";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data: session, isPending } = useSession();
    const [isHydrated, setIsHydrated] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // Show loading state during hydration and session fetch
    if (!isHydrated || isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return <>{children}</>;
}
