import { Suspense } from "react";
import CareerToolsSuccessClient from "./CareerToolsSuccessClient";

export default function CareerToolsSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CareerToolsSuccessClient />
    </Suspense>
  );
}
