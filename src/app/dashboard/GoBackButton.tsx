"use client";
import { Button } from "@/Components/ui/button";
import { ArrowLeft, ArrowUpIcon, Ghost } from "lucide-react";

import Link from "next/link";

type Props = {
    value: string | null;
    url: string;
}

export default function GobackButton({ Prop }: { Prop: Props }) {
    return (
        <>
            <div className="realtive">



                <Link href={Prop.url} >
                    <Button variant={"outline"} className="text-foreground text-sm group transition-all duration-500">

                        <ArrowLeft className="w-4 h-4 transition-transform duration-500 group-hover:rotate-360 " /> {Prop.value}

                    </Button>
                </Link>



            </div>
        </>
    )
}