const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');

const mdDir = path.join(__dirname, 'markdowns');
const outDir = path.join(__dirname, 'articles');
const tagDir = path.join(__dirname, 'tags');
const jsonPath = path.join(__dirname, 'articles.json');
const templatePath = path.join(__dirname, 'templates', 'article-template.html');
const listTemplatePath = path.join(__dirname, 'templates', 'list-template.html');

const articleTemplate = fs.readFileSync(templatePath, 'utf-8');
const listTemplate = fs.readFileSync(listTemplatePath, 'utf-8');

fs.ensureDirSync(outDir);
fs.ensureDirSync(tagDir);

// 日本語対応 slugify（タグ名やカテゴリ名をURL化）
const slugify = str => encodeURIComponent(str.trim());

// 記事一覧の格納用グローバル変数
const articles = [];

// 📄 Markdown 解析 & HTML 出力
fs.readdirSync(mdDir).forEach(file => {
  if (!file.endsWith('.md')) return;

  const fullPath = path.join(mdDir, file);
  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');

  const title = lines[0].replace(/^#\s*/, '').trim();
  const date = lines[1].replace(/^>\s*/, '').trim();
  const category = date.slice(0, 7);

  const tagsLine = lines.find(line => line.startsWith('[tags]')) || '';
  const tags = tagsLine.replace('[tags]', '')
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);

  const bodyStart = lines.findIndex(line =>
    line.trim() === '' || (!line.startsWith('#') && !line.startsWith('>') && !line.startsWith('['))
  );
  const body = lines.slice(bodyStart).join('\n');
  const htmlBody = marked.parse(body);
  const plainText = body.replace(/[`*_>#\-\[\]\(\)\r\n]/g, '').replace(/<[^>]+>/g, '');
  const excerpt = plainText.slice(0, 100);

  const filename = file.replace(/\.md$/, '.html');
  const outPath = path.join(outDir, filename);

  const html = articleTemplate
    .replace(/{{title}}/g, title)
    .replace(/{{date}}/g, date)
    .replace(/{{category}}/g, category)
    .replace(/{{tags}}/g, tags.map(tag => `<span class="tag">${tag}</span>`).join(' '))
    .replace(/{{content}}/g, htmlBody);
  fs.writeFileSync(outPath, html);

  articles.push({
    title,
    date,
    filename,
    excerpt,
    category,
    tags
  });
});

// 🟡 JSON 出力
fs.writeFileSync(jsonPath, JSON.stringify(articles, null, 2));

// 🔁 一覧ページ生成ユーティリティ
const renderListPage = (title, items) => {
  const listHtml = items.map(a => `
    <article>
      <h3><a href="${a.link}">${a.title}</a></h3>
      <p>${a.date}</p>
      <p>${a.excerpt}...</p>
    </article>
    <hr>
  `).join('');
  return listTemplate
    .replace(/{{title}}/g, title)
    .replace(/{{content}}/g, listHtml);
};

// 🗂 カテゴリ別ページ（YYYY-MM.html）
const groupedByCategory = {};
for (const article of articles) {
  if (!groupedByCategory[article.category]) {
    groupedByCategory[article.category] = [];
  }
  groupedByCategory[article.category].push({
    ...article,
    link: `articles/${article.filename}`
  });
}

for (const [category, group] of Object.entries(groupedByCategory)) {
  const html = renderListPage(`${category} の記事一覧`, group);
  fs.writeFileSync(path.join(__dirname, `${category}.html`), html);
}

// 🏷 タグ別ページ（スラッグ化対応）
const groupedByTag = {};
for (const article of articles) {
  for (const tag of article.tags) {
    if (!groupedByTag[tag]) groupedByTag[tag] = [];
    groupedByTag[tag].push({
      ...article,
      link: `../articles/${article.filename}`
    });
  }
}

for (const [tag, group] of Object.entries(groupedByTag)) {
  const tagSlug = slugify(tag);
  const html = renderListPage(`タグ: ${tag}`, group);
  fs.writeFileSync(path.join(tagDir, `${tagSlug}.html`), html);
}

// 📅 年別ページ（YYYY.html）→ 月別カテゴリ一覧リンク
const groupedByYear = {};
for (const article of articles) {
  const year = article.date.slice(0, 4);
  if (!groupedByYear[year]) groupedByYear[year] = new Set();
  groupedByYear[year].add(article.category);
}

for (const [year, months] of Object.entries(groupedByYear)) {
  const links = [...months].sort().map(month =>
    `<li><a href="${month}.html">${month}</a></li>`
  ).join('');
  const html = listTemplate
    .replace(/{{title}}/g, `${year} 年のアーカイブ`)
    .replace(/{{content}}/g, `<ul>${links}</ul>`);
  fs.writeFileSync(path.join(__dirname, `${year}.html`), html);
}

console.log('✅ 全ページ生成完了（記事、カテゴリ別、タグ別、年別）');
