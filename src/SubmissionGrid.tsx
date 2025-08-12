import "./SubmissionGrid.css";

type Submission = { url: string; image: string; price?: string | null };

type SubmissionGridProps = {
  submissions: Submission[];
  handleDelete: (index: number) => void;
};

const fmtPrice = (p?: string | null) => {
  if (!p) return "—";
  // remove commas, keep digits/dots
  const num = Number(String(p).replace(/[^\d.]/g, ""));
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
};

function SubmissionGrid({ submissions, handleDelete }: SubmissionGridProps) {
  return (
    <div className="submission-grid">
      {submissions.map((item, index) => (
        <a
          key={index}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="grid-card-link"
        >
          <div
            className="grid-card"
            onClick={(e) => e.stopPropagation()} // prevent bubbling from inside
          >
            <img src={item.image} alt={`Preview for ${item.url}`} />
            <p className="price">Price: {item.price ? `$${item.price}` : "—"}</p>

            <div
              className="delete-btn"
              onClick={(e) => {
                e.preventDefault(); // stop the link from opening
                e.stopPropagation(); // stop click from reaching parent <a>
                handleDelete(index);
              }}
              aria-label="Delete item"
              role="button"
              tabIndex={0}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                style={{ width: "24px", height: "24px" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

export default SubmissionGrid;
