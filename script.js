// === BASE パスを指定（GitHub Pages or ローカルを自動判定） ===
const BASE = location.hostname === 'localhost' ? '' : '/blog';

fetch(`${BASE}/articles.json`)
  .then(res => {
    if (!res.ok) throw new Error('JSON が読み込めませんでした');
    return res.json();
  })
  .then(data => {
    console.log('📦 記事一覧:', data);

    // === タグ一覧 ===
    const tagContainer = document.getElementById('tag-links');
    if (tagContainer) {
      const tagMap = {};
      data.forEach(a => {
        (a.tags || []).forEach(tag => {
          tagMap[tag] = (tagMap[tag] || 0) + 1;
        });
      });

      const tagListHtml = Object.keys(tagMap).sort().map(tag => {
  const slug = (window.tagSlugMap && window.tagSlugMap[tag]) || encodeURIComponent(tag);
  return `<li><a href="${BASE}/tags/${slug}.html">${tag} (${tagMap[tag]})</a></li>`;
}).join('');
      tagContainer.innerHTML = tagListHtml;
    }

    // === 月別アーカイブ ===
    const archiveContainer = document.getElementById('archive-links');
    if (archiveContainer) {
      const categoryMap = {};
      data.forEach(a => {
        categoryMap[a.category] = (categoryMap[a.category] || 0) + 1;
      });

      const archiveHtml = Object.keys(categoryMap).sort().reverse().map(cat => {
        return `<li><a href="${BASE}/${cat}.html">${cat} (${categoryMap[cat]})</a></li>`;
      }).join('');
      archiveContainer.innerHTML = archiveHtml;
    }

    // === 日付で降順ソート ===
    const sorted = data.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

    // === 現在地がトップページかを判定（/blog/用） ===
    const isTopPage =
      location.pathname === `${BASE}/` ||
      location.pathname === `${BASE}/index.html` ||
      location.pathname.endsWith(`${BASE}/index.html`);

    // === 最新記事エリア（トップ用） ===
    const container = document.getElementById('latest-articles');
    if (isTopPage && container) {
      sorted.slice(0, 10).forEach(article => {
        const div = document.createElement('div');
        div.innerHTML = `
          <h2><a href="${BASE}/articles/${article.filename}">${article.title}</a></h2>
          <p><em>${article.date}</em></p>
          <p>${article.excerpt}... <a href="${BASE}/articles/${article.filename}">Continue reading</a></p>
          <hr>
        `;
        container.appendChild(div);
      });
    }

    // === メイン記事（トップ一覧） ===
    const blog = document.getElementById('blog-posts');
    if (isTopPage && blog) {
      sorted.slice(0, 10).forEach(article => {
        const el = document.createElement('article');
        el.innerHTML = `
          <p>${article.date}</p>
          <h3>${article.title}</h3>
          <p class="description">${article.excerpt}...</p>
          <p><a href="${BASE}/articles/${article.filename}">Continue reading</a></p>
        `;
        blog.appendChild(el);
      });
    }

    // === サイドバー・フッター記事リンク ===
    const recent = document.getElementById('recent-posts');
    const footer = document.getElementById('footer-posts');
    const links = sorted.slice(0, 5).map(
      a => `<li><a href="${BASE}/articles/${a.filename}">${a.title}</a></li>`
    ).join('');
    if (recent) recent.innerHTML = links;
    if (footer) footer.innerHTML = links;
  })
  .catch(error => {
    console.error('🚨 JSON読み込みエラー:', error);
  });
