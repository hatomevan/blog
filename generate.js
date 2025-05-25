const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');

const mdDir = path.join(__dirname, 'markdowns');
const outDir = path.join(__dirname, 'articles');
const jsonPath = path.join(__dirname, 'articles.json');
const templatePath = path.join(__dirname, 'templates', 'article-template.html');
const template = fs.readFileSync(templatePath, 'utf-8');
const articles = [];

fs.ensureDirSync(outDir);

fs.readdirSync(mdDir).forEach(file => {
  if (!file.endsWith('.md')) return;

  const fullPath = path.join(mdDir, file);
  const content = fs.readFileSync(fullPath, 'utf-8');

  const lines = content.split('\n');
  const title = lines[0].replace(/^#\s*/, '').trim();
  const date = lines[1].replace(/^>\s*/, '').trim();
  const body = lines.slice(2).join('\n');
  const htmlBody = marked.parse(body);
  const excerpt = body.replace(/\n/g, '').slice(0, 100);

  const filename = file.replace(/\.md$/, '.html');
  const outPath = path.join(outDir, filename);

  const html = template
    .replace(/{{title}}/g, title)
    .replace(/{{date}}/g, date)
    .replace(/{{content}}/g, htmlBody);

  fs.writeFileSync(outPath, html);

  articles.push({
    title,
    date,
    filename,
    excerpt
  });
});

fs.writeFileSync(jsonPath, JSON.stringify(articles, null, 2));
console.log('✅ 記事HTMLと articles.json を生成しました');
