import { cookies, headers } from "next/headers";
import { vulnerabilityHighlights, plannedVulnerabilities } from "@/lib/vulnerabilities";

export const dynamic = "force-dynamic";

export default async function DebugPage() {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const requestHeaders = Array.from(headerStore.entries()).sort(([a], [b]) => a.localeCompare(b));
  const requestCookies = cookieStore.getAll();
  const envEntries = Object.entries(process.env).sort(([a], [b]) => a.localeCompare(b));

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Debug</h1>
          <p>Inspect runtime settings, request metadata, and vulnerability inventory.</p>
        </div>
      </div>

      <div className="grid two">
        <section className="card">
          <div className="card-header">Vulnerability Highlights</div>
          <div className="card-body">
            <ul className="plain-list">
              {vulnerabilityHighlights.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.summary}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="card">
          <div className="card-header">Planned Surfaces</div>
          <div className="card-body">
            <div className="tag-list">
              {plannedVulnerabilities.map((item) => (
                <span className="badge" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="card page-section">
        <div className="card-header">Request Headers</div>
        <div className="card-body table-wrap">
          <table className="table">
            <tbody>
              {requestHeaders.map(([key, value]) => (
                <tr key={key}>
                  <th>{key}</th>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid two page-section">
        <section className="card">
          <div className="card-header">Cookies</div>
          <div className="card-body table-wrap">
            <table className="table">
              <tbody>
                {requestCookies.map((cookie) => (
                  <tr key={cookie.name}>
                    <th>{cookie.name}</th>
                    <td>{cookie.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="card-header">Environment</div>
          <div className="card-body table-wrap">
            <table className="table">
              <tbody>
                {envEntries.map(([key, value]) => (
                  <tr key={key}>
                    <th>{key}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
