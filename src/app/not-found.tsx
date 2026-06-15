import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-xl place-items-center px-4 text-center">
      <div>
        <h1 className="text-4xl font-semibold">Not found</h1>
        <p className="mt-3 text-muted-foreground">That page or record is not available.</p>
        <Button asChild className="mt-6">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </section>
  );
}
