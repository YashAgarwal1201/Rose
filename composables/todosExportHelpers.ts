import type { TodoList, TodoItem } from "~/types/typesAndInterfaces";

export function generateJson(list: TodoList) {
  return JSON.stringify(list, null, 2);
}

export function generateTxt(list: TodoList) {
  const items = list.list
    .map((item, i) => `${i + 1}. [${item.isDone ? "x" : " "}] ${item.text}`)
    .join("\n");

  return `Title: ${list.title}\nCreated: ${list.timestamp}\n\n${items}`;
}

export function generateMarkdown(list: TodoList) {
  const items = list.list
    .map((item) => `- [${item.isDone ? "x" : " "}] ${item.text}`)
    .join("\n");

  return `# ${list.title}\n\nCreated: ${list.timestamp}\n\n${items}`;
}

export function generateCsv(list: TodoList) {
  const header = `"ID","Text","IsDone","Timestamp"`;
  const rows = list.list
    .map(
      (item) =>
        `"${item.id}","${item.text.replace(/"/g, '""')}",${item.isDone},"${
          item.timestamp
        }"`
    )
    .join("\n");

  return `${header}\n${rows}`;
}

export function generateHtml(list: TodoList) {
  const items = list.list
    .map((item) => `<li>${item.isDone ? "✅" : "⬜"} ${item.text}</li>`)
    .join("\n");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${list.title}</title>
    </head>
    <body>
      <h1>${list.title}</h1>
      <p>Created: ${list.timestamp}</p>
      <ul>
        ${items}
      </ul>
    </body>
    </html>
  `;
}
