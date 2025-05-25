
let jsonPath;
if (location.pathname.includes('/articles/')) {
  jsonPath = '../articles.json';
} else {
  jsonPath = 'articles.json';
}

fetch(jsonPath)
  .then(res => {
    if (!res.ok) throw new Error('JSON が読み込めませんでした');
    return res.json();
  })
  .then(data => {
    // タグ一覧表示
const tagContainer = document.getElementById('tag-links');
if (tagContainer) {
  const tagMap = {};
  data.forEach(a => {
    (a.tags || []).forEach(tag => {
      tagMap[tag] = (tagMap[tag] || 0) + 1;
    });
  });

  const tagListHtml = Object.keys(tagMap).sort().map(tag => {
    const slug = encodeURIComponent(tag); // もしくは slugify(tag)
    return `<li><a href="/tags/${slug}.html">${tag} (${tagMap[tag]})</a></li>`;
  }).join('');
  tagContainer.innerHTML = tagListHtml;
}

// 月別アーカイブ表示
const archiveContainer = document.getElementById('archive-links');
if (archiveContainer) {
  const categoryMap = {};
  data.forEach(a => {
    categoryMap[a.category] = (categoryMap[a.category] || 0) + 1;
  });

  const archiveHtml = Object.keys(categoryMap).sort().reverse().map(cat => {
    return `<li><a href="/${cat}.html">${cat} (${categoryMap[cat]})</a></li>`;
  }).join('');
  
  archiveContainer.innerHTML = archiveHtml;
}
    console.log('📦 記事一覧:', data);

// ここで一度コピーして日付降順ソート
const sorted = data.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

// 🔹 1. 最新記事エリア
const container = document.getElementById('latest-articles');
if (container) {
  sorted.slice(0, 10).forEach(article => {
    const div = document.createElement('div');
    div.innerHTML = `
      <h2><a href="articles/${article.filename}">${article.title}</a></h2>
      <p><em>${article.date}</em></p>
      <p>${article.excerpt}... <a href="articles/${article.filename}">Continue reading</a></p>
      <hr>
    `;
    container.appendChild(div);
  });
}

// 🔹 2. メイン記事
const blog = document.getElementById('blog-posts');
if (blog) {
  sorted.slice(0, 10).forEach(article => {
    const el = document.createElement('article');
    el.innerHTML = `
      <p>${article.date}</p>
      <h3>${article.title}</h3>
      <p class="description">${article.excerpt}...</p>
      <p><a href="articles/${article.filename}">Continue reading</a></p>
    `;
    blog.appendChild(el);
  });
}

// 🔹 3. サイドバー・フッター
const recent = document.getElementById('recent-posts');
const footer = document.getElementById('footer-posts');
const prefix = location.pathname.includes('/articles/') ? '../articles/' : 'articles/';
const links = sorted.slice(0, 5).map(
  a => `<li><a href="${prefix}${a.filename}">${a.title}</a></li>`
).join('');
if (recent) recent.innerHTML = links;
if (footer) footer.innerHTML = links;
})

