import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentFailedPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center px-4">
      <XCircle className="mb-6 size-16 text-destructive" />
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Payment Failed</h1>
      <p className="mb-8 max-w-md text-muted-foreground">
        We couldn't process your payment. Your account has not been charged. Please try again.
      </p>
      <Link href="/dashboard">
        <Button className="cursor-pointer" variant="outline">Return to Dashboard</Button>
      </Link>
    </div>
  );
}
