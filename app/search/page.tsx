import { unsafeGlobalSearch } from "@/lib/training-tools";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params?.q || "";
  const results = unsafeGlobalSearch(query);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Search</h1>
          <p>Search across users, profiles, projects, tasks, notes, files, and chat records.</p>
        </div>
      </div>

      <section className="card">
        <div className="card-header">Global Search</div>
        <div className="card-body">
          <form className="form-grid inline-form" action="/search" method="get">
            <div className="field">
              <label htmlFor="q">Query</label>
              <input id="q" name="q" defaultValue={query || "campaign"} />
            </div>
            <button className="button" type="submit">
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="card page-section">
        <div className="card-header">Results</div>
        <div className="card-body table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Source</th>
                <th>ID</th>
                <th>Title</th>
                <th>Body</th>
                <th>Extra</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td className="empty-cell" colSpan={5}>
                    {query ? "No matching records." : "Enter a query to search training data."}
                  </td>
                </tr>
              ) : (
                results.map((result, index) => (
                  <tr key={`${result.source}-${result.id}-${index}`}>
                    <td>{result.source}</td>
                    <td>{result.id}</td>
                    <td>{result.title}</td>
                    <td>{result.body}</td>
                    <td>{result.extra}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
