const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');

const mdDir = path.join(__dirname, 'markdowns');
const outDir = path.join(__dirname, 'articles');
const tagDir = path.join(__dirname, 'tags');
const jsonPath = path.join(__dirname, 'articles.json');
const templatePath = path.join(__dirname, 'templates', 'article-template.html');
const listTemplatePath = path.join(__dirname, 'templates', 'list-template.html');

const template = fs.readFileSync(templatePath, 'utf-8');
const listTemplate = fs.readFileSync(listTemplatePath, 'utf-8');

fs.ensureDirSync(outDir);
fs.ensureDirSync(tagDir);

const articles = [];

fs.readdirSync(mdDir).forEach(file => {
  if (!file.endsWith('.md')) return;

  const fullPath = path.join(mdDir, file);
  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');

  const title = lines[0].replace(/^#\s*/, '').trim();
  const date = lines[1].replace(/^>\s*/, '').trim();
  const category = date.slice(0, 7);

  const tagsLine = lines.find(line => line.startsWith('[tags]')) || '';
  const tags = tagsLine.replace('[tags]', '').split(',').map(tag => tag.trim()).filter(Boolean);

  const bodyStart = lines.findIndex(line => line.trim() === '' || !line.startsWith('#') && !line.startsWith('>') && !line.startsWith('['));
  const body = lines.slice(bodyStart).join('\n');
  const htmlBody = marked.parse(body);
  const plainText = body.replace(/[`*_>#\-\[\]\(\)\r\n]/g, '').replace(/<[^>]+>/g, '');
  const excerpt = plainText.slice(0, 100);

  const filename = file.replace(/\.md$/, '.html');
  const outPath = path.join(outDir, filename);
  

  const html = template
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

// 🟡 カテゴリ別ページ（YYYY-MM.html）
const groupedByCategory = {};
articles.forEach(a => {
  if (!groupedByCategory[a.category]) groupedByCategory[a.category] = [];
  groupedByCategory[a.category].push(a);
});

for (const [cat, group] of Object.entries(groupedByCategory)) {
  const listHtml = group.map(a => `
    <article>
      <h3><a href="articles/${a.filename}">${a.title}</a></h3>
      <p>${a.date}</p>
      <p>${a.excerpt}...</p>
    </article>
    <hr>
  `).join('');

  const html = listTemplate
    .replace(/{{title}}/g, `${cat} の記事一覧`)
    .replace(/{{content}}/g, listHtml);

  fs.writeFileSync(path.join(__dirname, `${cat}.html`), html);
}

// 🟡 タグ別ページ（tags/タグ.html）
const groupedByTag = {};
articles.forEach(a => {
  a.tags.forEach(tag => {
    if (!groupedByTag[tag]) groupedByTag[tag] = [];
    groupedByTag[tag].push(a);
  });
});

for (const [tag, group] of Object.entries(groupedByTag)) {
  const listHtml = group.map(a => `
    <article>
      <h3><a href="../articles/${a.filename}">${a.title}</a></h3>
      <p>${a.date}</p>
      <p>${a.excerpt}...</p>
    </article>
    <hr>
  `).join('');

  const html = listTemplate
  .replace(/{{title}}/g, `タグ: ${tag}`)
  .replace(/{{content}}/g, listHtml);

  fs.writeFileSync(path.join(tagDir, `${tag}.html`), html);
}

// 例: 「自己韜晦」→「jikotoukai」
const slugify = str => str.normalize("NFKD")
  .replace(/[^\w\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/--+/g, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase();

for (const [tag, group] of Object.entries(groupedByTag)) {
  const tagSlug = slugify(tag);
  const listHtml = group.map(a => `
    <article>
      <h3><a href="../articles/${a.filename}">${a.title}</a></h3>
      <p>${a.date}</p>
      <p>${a.excerpt}...</p>
    </article>
    <hr>
  `).join('');

  const html = listTemplate
    .replace(/{{title}}/g, `タグ: ${tag}`)
    .replace(/{{content}}/g, listHtml);

  fs.writeFileSync(path.join(tagDir, `${tagSlug}.html`), html);
}

// 年別カテゴリ
const groupedByYear = {};
articles.forEach(a => {
  const year = a.date.slice(0, 4);
  if (!groupedByYear[year]) groupedByYear[year] = new Set();
  groupedByYear[year].add(a.category);
});

for (const [year, months] of Object.entries(groupedByYear)) {
  const links = [...months].sort().map(m => {
    return `<li><a href="${m}.html">${m}</a></li>`;
  }).join('');
  const html = listTemplate
    .replace(/{{title}}/g, `${year} 年のアーカイブ`)
    .replace(/{{content}}/g, `<ul>${links}</ul>`);
  fs.writeFileSync(path.join(__dirname, `${year}.html`), html);
}


console.log('✅ 全ページ生成完了（記事、カテゴリ別、タグ別）');
