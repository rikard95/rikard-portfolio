#!/usr/bin/env node
import 'dotenv/config'
import fs from 'fs/promises'
import path from 'path'

const token = process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN
if (!token) {
  console.error('No token found. Set VITE_GITHUB_TOKEN or GITHUB_TOKEN environment variable.')
  process.exit(1)
}

const owner = process.argv[2] || 'rikard95'
const perPage = 100
let page = 1
let all = []

const headers = { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' }

async function fetchPage(p) {
  const url = `https://api.github.com/users/${owner}/repos?per_page=${perPage}&page=${p}&type=public`
  const res = await fetch(url, { headers })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`GitHub API error ${res.status}: ${txt}`)
  }
  return res.json()
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

function cleanReadmeText(readmeText) {
  if (!readmeText) return ''
  const withoutImages = readmeText.replace(/!\[[^\]]*]\((?:<[^>]+>|[^)]+)\)/g, ' ')
  const withoutHtmlImgs = withoutImages.replace(/<img\b[^>]*>/gi, ' ')
  const withoutTags = withoutHtmlImgs.replace(/<[^>]+>/g, ' ')
  const withoutLinks = withoutTags.replace(/\[([^\]]+)]\((?:<[^>]+>|[^)]+)\)/g, '$1')
  const withoutMd = withoutLinks.replace(/[#>*`]/g, '')
  return withoutMd.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*]\((<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\)/
const HTML_IMAGE_PATTERN = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/i
const GITHUB_BLOB_URL_PATTERN = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i

function extractFirstReadmeImage(readmeText) {
  if (!readmeText) return null
  const md = MARKDOWN_IMAGE_PATTERN.exec(readmeText)
  const html = HTML_IMAGE_PATTERN.exec(readmeText)
  const first = [md, html].filter(Boolean).sort((a,b)=>a.index-b.index)[0]
  if (!first) return null
  const src = (first[1] || '').trim()
  return src.replace(/^<|>$/g, '')
}

function resolveReadmeImageUrl(imageUrl, repoOwner, repoName, defaultBranch, readmePath='README.md') {
  if (!imageUrl || !repoName) return null
  const normalized = imageUrl.trim()
  if (!normalized) return null
  if (/^(javascript|data|vbscript|file):/i.test(normalized)) return null
  if (/^https?:\/\//i.test(normalized)) {
    const m = normalized.match(GITHUB_BLOB_URL_PATTERN)
    if (m) {
      const [, owner, repo, branch, filePath] = m
      const cleaned = filePath.split(/[?#]/)[0]
      return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${cleaned}`
    }
    return normalized
  }
  if (/^\/\//.test(normalized)) return `https:${normalized}`
  const branch = defaultBranch || 'main'
  const base = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/${readmePath}`
  if (normalized.startsWith('/')) {
    const root = normalized.replace(/^\/+/, '')
    return `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/${root}`
  }
  try { return new URL(normalized, base).toString() } catch { return null }
}

;(async () => {
  try {
    while (true) {
      const data = await fetchPage(page)
      if (!Array.isArray(data) || data.length === 0) break
      all.push(...data)
      if (data.length < perPage) break
      page += 1
    }

    // Enrich each repo with readme, languages and resolved image where possible
    const enriched = []
      for (const r of all) {
      const repoOwner = (r.owner && r.owner.login) ? r.owner.login : owner
      const repoName = r.name
      let readmeFull = null
      let longDescription = r.description || null
      let resolvedImage = null
      let stack = null
      try {
        const [readmeRes, langRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/readme`, { headers }).then(rr => rr.ok ? rr.json() : null).catch(() => null),
          fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/languages`, { headers }).then(rr => rr.ok ? rr.json() : null).catch(() => null),
        ])

        if (readmeRes && readmeRes.content) {
          const b64 = readmeRes.content.replace(/\n/g, '')
          const decoded = Buffer.from(b64, 'base64').toString('utf8')
          const firstPara = getFirstReadmeParagraph(decoded)
          longDescription = firstPara.slice(0, 800)
          readmeFull = cleanReadmeText(decoded)
          const firstImage = extractFirstReadmeImage(decoded)
          const resolved = resolveReadmeImageUrl(firstImage, repoOwner, repoName, r.default_branch, readmeRes.path)
          if (resolved) resolvedImage = resolved
        } else {
          console.log(`No README for ${repoOwner}/${repoName} (status: ${readmeRes && readmeRes.message ? readmeRes.message : 'none'})`)
        }

        if (langRes && typeof langRes === 'object') {
          const langs = Object.keys(langRes)
          stack = langs.slice(0,6)
        }
      } catch (e) {
        // ignore per-repo enrichment errors
      }

      if (!resolvedImage) {
        console.log(`No image resolved for ${repoOwner}/${repoName}`)
      }

      enriched.push({
        name: r.name,
        description: r.description,
        html_url: r.html_url,
        homepage: r.homepage,
        language: r.language,
        owner: repoOwner,
        fork: r.fork,
        updated_at: r.updated_at,
        default_branch: r.default_branch,
        readmeFull,
        longDescription,
        image: resolvedImage,
        stack,
      })
    }

    const outPath = path.resolve('public', 'repos.json')
    await fs.mkdir(path.dirname(outPath), { recursive: true })
    await fs.writeFile(outPath, JSON.stringify(enriched, null, 2), 'utf8')
    console.log('Wrote', enriched.length, 'repos to', outPath)
  } catch (e) {
    console.error('Failed to fetch repos:', e.message || e)
    process.exit(2)
  }
})()
