"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
};

export function MobileNav({
  items,
  isAdmin
}: {
  items: NavItem[];
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);

  const navItems = isAdmin ? [...items, { href: "/admin", label: "Admin" }] : items;

  return (
    <div className="relative md:hidden">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        className="h-11 w-11 rounded-full border-white/10 bg-white/5 backdrop-blur-xl"
      >
        {open ? <X size={16} /> : <Menu size={16} />}
      </Button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute right-0 top-full mt-3 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/10 bg-background/95 p-2 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl"
            )}
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/8 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
