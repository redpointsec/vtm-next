import { getApiDocs } from "@/lib/api-data";

export default function DocsPage() {
  const docs = getApiDocs();

  return (
    <>
      <div className="page-header">
        <div>
          <h1>API Docs</h1>
          <p>{docs.warning}</p>
        </div>
      </div>

      <section className="card">
        <div className="card-header">{docs.title}</div>
        <div className="card-body table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Methods</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {docs.routes.map((route) => (
                <tr key={route.path}>
                  <td>
                    <a href={route.path}>{route.path}</a>
                  </td>
                  <td>{route.methods.join(", ")}</td>
                  <td>{route.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
