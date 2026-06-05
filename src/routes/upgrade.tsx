import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy tier upgrade page has been unified with VIP upgrade flow.
// Any direct visit to /upgrade redirects to the VIP page (which carries
// rotating M-Pesa numbers and all tier ladders).
export const Route = createFileRoute("/upgrade")({
  beforeLoad: () => {
    throw redirect({ to: "/vip" });
  },
  component: () => null,
});
