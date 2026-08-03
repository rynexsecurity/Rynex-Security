import React from "react";

// Deliberately renders only text and conservative Markdown constructs. HTML/MDX is never executed.
export function SafeMarkdown({ source }: { source: string }) {
  return <>{source.slice(0, 100_000).split(/\n{2,}/).map((block, index) => {
    const text = block.replace(/^#{1,6}\s*/, "").trim();
    if (block.startsWith("### ")) return <h3 key={index}>{text}</h3>;
    if (block.startsWith("## ")) return <h2 key={index}>{text}</h2>;
    if (block.startsWith("# ")) return <h1 key={index}>{text}</h1>;
    if (block.split("\n").every((line) => /^[-*]\s+/.test(line))) return <ul key={index}>{block.split("\n").map((line, i) => <li key={i}>{line.replace(/^[-*]\s+/, "")}</li>)}</ul>;
    return <p key={index}>{text}</p>;
  })}</>;
}
