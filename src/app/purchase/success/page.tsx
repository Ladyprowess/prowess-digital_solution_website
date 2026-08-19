import { Suspense } from "react";
import PurchaseSuccessClient from "./PurchaseSuccessClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function PurchaseSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="mx-auto max-w-5xl px-4 py-14">
            <h1 className="text-2xl font-semibold text-foreground">Payment received</h1>
            <p className="mt-4 text-sm text-muted-foreground">Confirming your payment...</p>
          </div>
        </div>
      }
    >
      <PurchaseSuccessClient />
    </Suspense>
  );
}
