/**
 * מציג טקסט פשוט שהמנהל כותב: "## " = כותרת, "- " = פריט ברשימה, שורה ריקה = פסקה חדשה.
 * הטקסט מוצג כטקסט בלבד (בלי HTML), כך שאין סיכון להזרקת קוד.
 */
export function RichText({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];

  const flushList = () => {
    if (list.length) {
      blocks.push(
        <ul key={`l${blocks.length}`} className="list-disc space-y-1 pr-5 marker:text-accent">
          {list.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  const flushPara = () => {
    if (para.length) {
      blocks.push(
        <p key={`p${blocks.length}`} className="leading-relaxed">
          {para.join(" ")}
        </p>,
      );
      para = [];
    }
  };

  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flushList();
      flushPara();
    } else if (line.startsWith("## ")) {
      flushList();
      flushPara();
      blocks.push(
        <h2 key={`h${blocks.length}`} className="pt-2 text-lg font-bold">
          {line.slice(3)}
        </h2>,
      );
    } else if (line.startsWith("- ")) {
      flushPara();
      list.push(line.slice(2));
    } else {
      flushList();
      para.push(line);
    }
  }
  flushList();
  flushPara();

  return <div className="space-y-3 text-sm">{blocks}</div>;
}
