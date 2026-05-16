import { runPingUnsafe } from "@/lib/training-tools";

export const dynamic = "force-dynamic";

type PingPageProps = {
  searchParams?: Promise<{
    host?: string;
  }>;
};

export default async function PingPage({ searchParams }: PingPageProps) {
  const params = await searchParams;
  const host = params?.host || "";
  const output = runPingUnsafe(host);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Ping Utility</h1>
          <p>Run a host reachability check from the server.</p>
        </div>
      </div>

      <section className="card">
        <div className="card-header">Server Ping</div>
        <div className="card-body">
          <form className="form-grid inline-form" action="/ping" method="get">
            <div className="field">
              <label htmlFor="host">Host</label>
              <input id="host" name="host" defaultValue={host || "127.0.0.1"} />
            </div>
            <button className="button" type="submit">
              Run ping
            </button>
          </form>
        </div>
      </section>

      <section className="card page-section">
        <div className="card-header">Output</div>
        <div className="card-body">
          <pre className="code-output">{output || "No command has been run."}</pre>
        </div>
      </section>
    </>
  );
}
