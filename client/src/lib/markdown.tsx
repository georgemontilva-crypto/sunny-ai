// Renders a post's markdown body to React elements — the single renderer
// used by the SSR/prerender pass, by client hydration, and by the /admin/blog
// live preview, so all three produce identical markup.
//
// This is also where the sanitization happens, and it's structural rather
// than a post-hoc scrub of an HTML string: `marked` is used only as a
// *lexer*, and its tokens are mapped onto an allowlist of React elements.
// Nothing here ever calls dangerouslySetInnerHTML, so there is no path from
// a `posts.content` value to raw markup in the prerendered page:
//
//   - `html` tokens (both the block kind, `<script>alert(1)</script>`, and
//     the inline kind, `<b>`/`<div onclick=…>`) are dropped outright. Raw
//     HTML in a post body simply doesn't render — it is not escaped-and-shown
//     either, because half-rendered angle brackets read as a bug to the
//     author, while nothing appearing is an unambiguous "that isn't
//     supported".
//   - link hrefs and image srcs go through safeUrl(), an allowlist of
//     http/https/mailto/tel plus site-relative paths, checked against a
//     whitespace-stripped copy so `java\tscript:` can't sneak past it.
//     A rejected URL degrades to plain text rather than to a dead link.
//   - every other value reaches the DOM as a React child, which React
//     escapes on both the server and the client.
//
// The content is authored by panel admins, not by the public, so this isn't
// the last line of defence against a hostile author — but the body ends up
// baked into static HTML that no request-time filter ever sees again, which
// is exactly the situation where "the renderer can't emit markup" is worth
// more than "we remembered to sanitize".
import { marked, type Token, type Tokens } from "marked";
import { Fragment, type ReactNode } from "react";

// marked leaves HTML entities untouched in text tokens (it relies on them
// passing through into HTML). React children are literal text, so they'd
// show up as "&mdash;" on the page — decode the handful an author actually
// types, plus numeric references.
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  laquo: "«",
  raquo: "»",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
  deg: "°",
  times: "×",
  middot: "·",
  bull: "•",
  eacute: "é",
  copy: "©",
  reg: "®",
  trade: "™",
};

function decodeEntities(text: string): string {
  if (!text.includes("&")) return text;
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (match, body: string) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      // Control characters are dropped rather than decoded — an author has
      // no reason to write one, and they'd be invisible noise in the output.
      if (!Number.isFinite(code) || code < 0x20 || code > 0x10ffff) return "";
      try {
        return String.fromCodePoint(code);
      } catch {
        return "";
      }
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}

// Allowlist, not a denylist. Returns undefined for anything it doesn't
// positively recognise, and callers render the link/image as plain text
// instead. The `probe` copy has all whitespace and control characters
// removed before the scheme is matched, so "java\tscript:" and
// "java\nscript:" are tested as "javascript:" and rejected with everything
// else that isn't on the list.
function safeUrl(raw: string, allowMailtoAndTel: boolean): string | undefined {
  const url = raw.trim();
  if (!url) return undefined;
  const probe = url.replace(/[\s\u0000-\u001f]/g, "").toLowerCase();
  if (/^https?:\/\//.test(probe)) return url;
  if (allowMailtoAndTel && /^(mailto:|tel:)/.test(probe)) return url;
  // Site-relative paths and in-page anchors. A bare "blog/post" (no leading
  // slash) is deliberately not accepted: it would resolve differently
  // depending on the page it's rendered from, which is never what the
  // author meant.
  if (/^[/#]/.test(probe)) return url;
  return undefined;
}

function renderInline(tokens: Token[] | undefined, keyPrefix: string): ReactNode {
  if (!tokens) return null;
  return tokens.map((token, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (token.type) {
      case "text":
      case "escape":
        return decodeEntities((token as Tokens.Text).text);
      case "strong":
        return <strong key={key}>{renderInline((token as Tokens.Strong).tokens, key)}</strong>;
      case "em":
        return <em key={key}>{renderInline((token as Tokens.Em).tokens, key)}</em>;
      case "del":
        return <del key={key}>{renderInline((token as Tokens.Del).tokens, key)}</del>;
      case "codespan":
        return <code key={key}>{decodeEntities((token as Tokens.Codespan).text)}</code>;
      case "br":
        return <br key={key} />;
      case "link": {
        const link = token as Tokens.Link;
        const href = safeUrl(link.href, true);
        const children = renderInline(link.tokens, key);
        if (!href) return <span key={key}>{children}</span>;
        const external = /^https?:\/\//i.test(href.trim());
        return (
          <a
            key={key}
            href={href}
            title={link.title ?? undefined}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {children}
          </a>
        );
      }
      case "image": {
        const image = token as Tokens.Image;
        const src = safeUrl(image.href, false);
        const alt = decodeEntities(image.text ?? "");
        if (!src) return <span key={key}>{alt}</span>;
        return <img key={key} src={src} alt={alt} title={image.title ?? undefined} loading="lazy" />;
      }
      // Raw HTML inside a paragraph — dropped, see the file header.
      case "html":
        return null;
      default:
        return null;
    }
  });
}

function renderListItem(item: Tokens.ListItem, key: string): ReactNode {
  const body = renderBlocks(item.tokens, key);
  if (!item.task) return <li key={key}>{body}</li>;
  return (
    <li key={key} className="list-none -ml-5 flex items-start gap-2">
      <input type="checkbox" checked={item.checked ?? false} readOnly className="mt-1.5" />
      <span>{body}</span>
    </li>
  );
}

function renderBlocks(tokens: Token[] | undefined, keyPrefix: string): ReactNode {
  if (!tokens) return null;
  return tokens.map((token, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (token.type) {
      case "heading": {
        const heading = token as Tokens.Heading;
        const Tag = `h${Math.min(6, Math.max(1, heading.depth))}` as "h1";
        return <Tag key={key}>{renderInline(heading.tokens, key)}</Tag>;
      }
      case "paragraph":
        return <p key={key}>{renderInline((token as Tokens.Paragraph).tokens, key)}</p>;
      case "text": {
        // A tight list item's body, or a plain text block: it carries inline
        // tokens of its own when there's anything to mark up. Wrapped in a
        // Fragment rather than a <span> so a plain "- item" renders as
        // <li>item</li> — an extra inline element inside every bullet would
        // fight the prose styles for no reason.
        const text = token as Tokens.Text;
        return text.tokens ? (
          <Fragment key={key}>{renderInline(text.tokens, key)}</Fragment>
        ) : (
          decodeEntities(text.text)
        );
      }
      case "list": {
        const list = token as Tokens.List;
        const items = list.items.map((item, j) => renderListItem(item, `${key}-${j}`));
        if (!list.ordered) return <ul key={key}>{items}</ul>;
        const start = Number(list.start);
        return (
          <ol key={key} start={Number.isFinite(start) && start !== 1 ? start : undefined}>
            {items}
          </ol>
        );
      }
      case "blockquote":
        return <blockquote key={key}>{renderBlocks((token as Tokens.Blockquote).tokens, key)}</blockquote>;
      case "code": {
        const code = token as Tokens.Code;
        return (
          <pre key={key}>
            <code className={code.lang ? `language-${code.lang.split(/\s+/)[0]}` : undefined}>{code.text}</code>
          </pre>
        );
      }
      case "hr":
        return <hr key={key} />;
      case "table": {
        const table = token as Tokens.Table;
        return (
          <div key={key} className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  {table.header.map((cell, j) => (
                    <th key={`${key}-h-${j}`} style={cell.align ? { textAlign: cell.align } : undefined}>
                      {renderInline(cell.tokens, `${key}-h-${j}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, r) => (
                  <tr key={`${key}-r-${r}`}>
                    {row.map((cell, c) => (
                      <td key={`${key}-r-${r}-${c}`} style={cell.align ? { textAlign: cell.align } : undefined}>
                        {renderInline(cell.tokens, `${key}-r-${r}-${c}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      // Raw HTML block, link reference definition, blank line: nothing to
      // render. See the file header for why `html` is dropped rather than
      // escaped and shown.
      case "html":
      case "def":
      case "space":
        return null;
      default:
        return null;
    }
  });
}

// The article body's typography, shared by the public post page and the
// /admin/blog live preview so the two can't drift apart — a preview that
// styles headings differently from the real page is a preview you stop
// trusting.
export const POST_PROSE_CLASSNAME =
  "prose prose-lg max-w-none " +
  "prose-headings:font-bold prose-headings:tracking-tight " +
  "prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 " +
  "prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 " +
  "prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-5 " +
  "prose-ul:text-muted-foreground prose-li:mb-2 " +
  "prose-strong:text-foreground prose-strong:font-semibold " +
  "prose-a:text-primary prose-a:font-medium " +
  "prose-blockquote:text-muted-foreground prose-img:rounded-xl";

export function renderMarkdown(markdown: string): ReactNode {
  if (!markdown.trim()) return null;
  // No `gfm: false` / `breaks: true` overrides — the defaults (GFM on,
  // single newlines are not <br>) are what the migrated MDX bodies were
  // written against.
  return renderBlocks(marked.lexer(markdown), "md");
}
