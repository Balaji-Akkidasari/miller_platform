export interface FaqItem { q: string; a: string; tags?: string[] }

/** Native <details> so it is keyboard accessible and works without JS.
 *  FAQPage microdata is inline, which is what search engines read. */
export function Faq({ items, openFirst = true }: { items: FaqItem[]; openFirst?: boolean }) {
  return (
    <div className="faq" itemScope itemType="https://schema.org/FAQPage">
      {items.map((f, i) => (
        <details key={f.q} className="fq" open={openFirst && i === 0}
                 itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
          <summary>
            <span itemProp="name">{f.q}</span>
            <span className="fqi" aria-hidden="true" />
          </summary>
          <div className="fqa" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
            <p itemProp="text">{f.a}</p>
            {!!f.tags?.length && (
              <div className="fqtags">
                {f.tags.map((t) => <span className="fqtag" key={t}>{t}</span>)}
              </div>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
