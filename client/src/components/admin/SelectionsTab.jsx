import { useEffect, useState } from "react";
import { api } from "../../api.js";

const when = (iso) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

// Designs that logged-in customers selected, newest first, so the shop can contact them.
export default function SelectionsTab() {
  const [list, setList] = useState({ selections: [], page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [moreBusy, setMoreBusy] = useState(false);

  useEffect(() => {
    api("/api/admin/selections?page=1&limit=30")
      .then(setList)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const loadMore = async () => {
    setMoreBusy(true);
    try {
      const d = await api(`/api/admin/selections?page=${list.page + 1}&limit=30`);
      setList((l) => ({ ...d, selections: [...l.selections, ...d.selections.filter((x) => !l.selections.some((y) => y.id === x.id))] }));
    } catch (e) {
      setErr(e.message);
    } finally {
      setMoreBusy(false);
    }
  };

  if (loading) return <p className="muted">Loading...</p>;
  return (
    <div className="adm">
      {err && <p className="err" role="alert">{err}</p>}
      {!err && list.selections.length === 0 && <p className="muted">No selections yet. They appear here when a logged-in customer presses "Select design".</p>}
      {list.selections.length > 0 && (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th>When</th><th>Customer</th><th>Design</th><th>Weight</th></tr>
            </thead>
            <tbody>
              {list.selections.map((s) => (
                <tr key={s.id}>
                  <td>{when(s.createdAt)}</td>
                  <td>
                    {s.user ? (
                      <>
                        {s.user.name}<br />
                        {s.user.phone && <a href={`tel:${s.user.phone}`}>{s.user.phone}</a>}
                        {s.user.phone && <br />}
                        <a href={`mailto:${s.user.email}`}>{s.user.email}</a>
                      </>
                    ) : <span className="muted">Deleted account</span>}
                  </td>
                  <td>{s.designName}<br /><span className="muted">{s.source}</span></td>
                  <td>{s.weight} g</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {list.page < list.pages && <div><button className="btn" onClick={loadMore} disabled={moreBusy}>{moreBusy ? "Loading..." : "Show more"}</button></div>}
      {list.total > 0 && <p className="muted">{list.selections.length} of {list.total} selections shown</p>}
    </div>
  );
}
