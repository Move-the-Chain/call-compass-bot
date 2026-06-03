import { createFileRoute } from "@tanstack/react-router";
import ServiceSecureApp from "@/components/service-secure/ServiceSecureApp";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Service Secure — AI Call Intelligence" },
      { name: "description", content: "AI that reviews every call and surfaces the moments that need a human." },
    ],
  }),
  component: Index,
});

function Index() {
  return <ServiceSecureApp />;
}
