import 'dotenv/config'

export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN
  if (!token) {
    return res.status(400).json({ error: 'Missing GITHUB_TOKEN in environment' })
  }

  const owner = req.query?.owner || 'rikard95'
  const perPage = 100
  let page = 1
  const all = []
  const headers = {
    Authorization: `token ${token}`,
    'User-Agent': 'portfolio-app',
    Accept: 'application/vnd.github.v3+json',
  }

  try {
    while (true) {
      const url = `https://api.github.com/users/${owner}/repos?per_page=${perPage}&page=${page}&type=public`
      const r = await fetch(url, { headers })
      if (!r.ok) {
        const txt = await r.text().catch(() => '')
        return res.status(r.status).json({ error: 'GitHub API error', status: r.status, body: txt })
      }
      const data = await r.json()
      if (!Array.isArray(data) || data.length === 0) break
      all.push(...data)
      if (data.length < perPage) break
      page += 1
    }

    // Enrich each repo with README text, languages and first image when possible
    const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*]\((<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\)/
    const HTML_IMAGE_PATTERN = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/i
    const GITHUB_BLOB_URL_PATTERN = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i

    function extractFirstReadmeImage(readmeText) {
      if (!readmeText) return null
      const md = MARKDOWN_IMAGE_PATTERN.exec(readmeText)
      const html = HTML_IMAGE_PATTERN.exec(readmeText)
      const first = [md, html].filter(Boolean).sort((a, b) => a.index - b.index)[0]
      if (!first) return null
      const src = (first[1] || '').trim()
      return src.replace(/^<|>$/g, '')
    }

    function getFirstReadmeParagraph(readmeText) {
      if (!readmeText) return ''
      const stripped = readmeText.replace(/!\[[^\]]*]\((?:<[^>]+>|[^)]+)\)/g, ' ').replace(/<img\b[^>]*>/gi, ' ')
      const paragraphs = stripped
        .split(/\n\n+/)
        .map(p => p.replace(/\[([^\]]+)]\((?:<[^>]+>|[^)]+)\)/g, '$1').replace(/<[^>]+>/g, ' ').replace(/[#>*`]/g, '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
      return paragraphs[0] || ''
    }

    function resolveReadmeImageUrl(imageUrl, owner, repo, defaultBranch, readmePath = 'README.md') {
      if (!imageUrl) return null
      const normalized = imageUrl.trim()
      if (!normalized) return null
      if (/^https?:\/\//i.test(normalized)) {
        const m = normalized.match(GITHUB_BLOB_URL_PATTERN)
        if (m) {
          const [, o, r, branch, filePath] = m
          const cleaned = filePath.split(/[?#]/)[0]
          return `https://raw.githubusercontent.com/${o}/${r}/${branch}/${cleaned}`
        }
        return normalized
      }
      if (/^\/\//.test(normalized)) return `https:${normalized}`
      const branch = defaultBranch || 'main'
      if (normalized.startsWith('/')) {
        const root = normalized.replace(/^\/+/, '')
        return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${root}`
      }
      try { return new URL(normalized, `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${readmePath}`).toString() } catch { return null }
    }

    const enriched = await Promise.all(all.map(async (r) => {
      const repoOwner = r.owner && r.owner.login ? r.owner.login : owner
      const repoName = r.name
      let readmeFull = null
      let longDescription = r.description || null
      let image = null
      let stack = null

      try {
        const [readmeRes, langRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/readme`, { headers }).then(x => x.ok ? x.json() : null).catch(() => null),
          fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/languages`, { headers }).then(x => x.ok ? x.json() : null).catch(() => null),
        ])

        if (readmeRes && readmeRes.content) {
          const b64 = readmeRes.content.replace(/\n/g, '')
          const decoded = Buffer.from(b64, 'base64').toString('utf8')
          const firstPara = getFirstReadmeParagraph(decoded)
          longDescription = firstPara.slice(0, 800)
          readmeFull = decoded
          const firstImage = extractFirstReadmeImage(decoded)
          const resolved = resolveReadmeImageUrl(firstImage, repoOwner, repoName, r.default_branch, readmeRes.path)
          if (resolved) image = resolved
        }

        if (langRes && typeof langRes === 'object') {
          stack = Object.keys(langRes).slice(0, 6)
        }
      } catch (e) {
        // ignore per-repo enrichment errors
      }

      return Object.assign({}, r, { readmeFull, longDescription, image, stack })
    }))

    return res.status(200).json(enriched)
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) })
  }
}
