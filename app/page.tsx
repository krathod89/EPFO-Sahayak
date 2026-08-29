// Placeholder home page. Design is being built separately (see Design/UI-UX Design Prompt.md)
// — swap this out once that's ready. Confirms the backend endpoint exists and how to reach
// it, so this isn't a dead end while the UI is in progress.
export default function HomePage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: 640 }}>
      <h1>EPFO Sahayak — backend scaffold</h1>
      <p>The UI is being designed separately. This backend exposes one endpoint:</p>
      <ul>
        <li>
          <code>POST /api/diagnose</code> — decode a rejection or check pre-filing readiness.
        </li>
      </ul>
      <p>
        Analytics events are tracked in Mixpanel (server-computed events from this endpoint;
        client events sent directly from the browser once the UI exists) — see{" "}
        <code>Engineering/analytics.md</code>.
      </p>
      <p>See <code>Engineering/spec.md</code> and <code>Rule Engine/Rule Engine Spec.md</code> for the full contract.</p>
    </main>
  );
}
