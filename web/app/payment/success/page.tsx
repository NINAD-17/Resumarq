import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center px-4">
      <CheckCircle className="mb-6 size-16 text-primary" />
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Payment Successful</h1>
      <p className="mb-8 max-w-md text-muted-foreground">
        Thank you for your purchase! Your quota has been updated. You can now continue using Resumarq.
      </p>
      <Link href="/dashboard">
        <Button className="cursor-pointer">Return to Dashboard</Button>
      </Link>
    </div>
  );
}
