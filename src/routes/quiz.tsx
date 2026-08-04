import { createFileRoute, redirect } from "@tanstack/react-router";

// The six-step form this route used to serve is gone — the intake is now a
// real conversation on the landing page (see components/IntakeChat.tsx).
//
// The route itself stays as a redirect rather than being deleted, because
// /quiz was linked from the header, the footer, the landing page, the
// science page, the example report and the comparison pages, and it is out
// there in ads and in people's history. Deleting it would 404 all of that.
// Worse, leaving the old form alive meant a share of users went through a
// completely different product: no safety tiers, no reply-quality rules,
// no request to see the thread. One redirect closes every one of those
// doors at once, including the ones nobody remembered to update.
export const Route = createFileRoute("/quiz")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});
