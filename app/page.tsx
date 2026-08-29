// Placeholder home page. Design is being built separately (see Design/UI-UX Design Prompt.md)
// — swap this out once that's ready. Confirms the two backend endpoints exist and how to
// reach them, so this isn't a dead end while the UI is in progress.
export default function HomePage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: 640 }}>
      <h1>EPFO Sahayak — backend scaffold</h1>
      <p>The UI is being designed separately. This backend exposes two endpoints:</p>
      <ul>
        <li>
          <code>POST /api/diagnose</code> — decode a rejection or check pre-filing readiness.
        </li>
        <li>
          <code>POST /api/events</code> — log an anonymous analytics event.
        </li>
      </ul>
      <p>See <code>Engineering/spec.md</code> and <code>Rule Engine/Rule Engine Spec.md</code> for the full contract.</p>
    </main>
  );
}
