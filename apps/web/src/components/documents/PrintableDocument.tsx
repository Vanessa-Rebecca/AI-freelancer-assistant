import { createPortal } from 'react-dom';
import { useAuth } from '../../auth/AuthContext.tsx';

type PrintableDocumentProps = {
  // Document kind shown above the title, e.g. "Proposal"
  kind: string;
  title: string;
  // Lines under the title, e.g. "Prepared for Sarah"
  meta: string[];
  body: string;
};

/**
 * Clean, branded copy of a document that only appears when printing.
 * The print stylesheet in index.css hides everything else on the page, so
 * "Save as PDF" in the print dialog produces just this. It is rendered straight
 * into <body>, outside the app, so the hidden app takes no space on paper.
 */
export function PrintableDocument({ kind, title, meta, body }: PrintableDocumentProps) {
  const { user } = useAuth();
  const author = user?.profile?.fullName;

  return createPortal(
    <article className="print-only" aria-hidden>
      <header className="print-header">
        <div>
          {author && <p className="print-author">{author}</p>}
          {user?.email && <p className="print-muted">{user.email}</p>}
        </div>
        <p className="print-kind">{kind}</p>
      </header>

      <h1 className="print-title">{title}</h1>
      {meta.map((line) => (
        <p key={line} className="print-muted">
          {line}
        </p>
      ))}

      <div className="print-body">
        {body
          .trim()
          .split(/\n{2,}/)
          .map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
      </div>

      <footer className="print-footer">Prepared with AI Freelancer Assistant</footer>
    </article>,
    document.body,
  );
}
