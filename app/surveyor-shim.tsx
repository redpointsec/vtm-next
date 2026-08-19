// SurveyorShim - passive traffic monitor (loaded from central CDN).
//
// Config is supplied at runtime by the ECS task definition. This is a server
// component, and the root layout already opts into dynamic rendering (it calls
// headers()), so process.env is read per request rather than baked in at build
// time. Renders nothing when SURVEYOR_INGEST_URL is empty.
//
// mpaMode is false — VTM Next is client-routed, so events should batch instead
// of flushing on every full page load.
export default function SurveyorShim() {
  const ingestUrl = process.env.SURVEYOR_INGEST_URL;
  if (!ingestUrl) return null;

  const shimUrl =
    process.env.SURVEYOR_SHIM_URL || "https://shim.rdpt.dev/surveyor.js";

  const config = {
    ingestUrl,
    apiKey: process.env.SURVEYOR_API_KEY || "",
    appId: process.env.SURVEYOR_APP_ID || "",
    sampleRate: 1.0,
    mpaMode: false,
    debug: false,
  };

  // JSON.stringify can emit "</script>" and close the block early, so escape
  // the sequence that would do it.
  const inline = `window.SurveyorShimConfig=${JSON.stringify(config).replace(
    /</g,
    "\\u003c",
  )};`;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: inline }} />
      <script src={shimUrl} defer />
    </>
  );
}
