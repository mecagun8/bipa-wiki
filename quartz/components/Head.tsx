import { i18n } from "../i18n"
import { FullSlug, getFileExtension, joinSegments, pathToRoot } from "../util/path"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { googleFontHref, googleFontSubsetHref } from "../util/theme"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { unescapeHTML } from "../util/escape"
import { CustomOgImagesEmitterName } from "../../.quartz/plugins"
export default (() => {
  const Head: QuartzComponent = ({
    cfg,
    fileData,
    externalResources,
    ctx,
  }: QuartzComponentProps) => {
    const titleSuffix = cfg.pageTitleSuffix ?? ""
    const title =
      (fileData.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title) + titleSuffix
    const description =
      fileData.frontmatter?.socialDescription ??
      fileData.frontmatter?.description ??
      unescapeHTML(fileData.description?.trim() ?? i18n(cfg.locale).propertyDefaults.description)

    const { css, js, additionalHead } = externalResources

    const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
    const path = url.pathname as FullSlug
    const baseDir = fileData.slug === "404" ? path : pathToRoot(fileData.slug!)
    const iconPath = joinSegments(baseDir, "static/icon.png")

    // Url of current page
    const socialUrl =
      fileData.slug === "404" ? url.toString() : joinSegments(url.toString(), fileData.slug!)

    const usesCustomOgImage = ctx.cfg.plugins.emitters.some(
      (e) => e.name === CustomOgImagesEmitterName,
    )
    const ogImageDefaultPath = `https://${cfg.baseUrl}/static/og-image.png`

    const coreStylesheet = css[0]?.content
    const coreScript = js.find(
      (r) => r.loadTime === "beforeDOMReady" && r.contentType === "external",
    )

    return (
      <head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        {coreStylesheet && <link rel="preload" href={coreStylesheet} as="style" />}
        {coreScript && coreScript.contentType === "external" && (
          <link rel="preload" href={coreScript.src} as="script" />
        )}
        {cfg.theme.cdnCaching && cfg.theme.fontOrigin === "googleFonts" && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" />
            <link rel="stylesheet" href={googleFontHref(cfg.theme)} />
            {cfg.theme.typography.title && (
              <link rel="stylesheet" href={googleFontSubsetHref(cfg.theme, cfg.pageTitle)} />
            )}
          </>
        )}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <meta name="og:site_name" content={cfg.pageTitle}></meta>
        <meta property="og:title" content={title} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta property="og:description" content={description} />
        <meta property="og:image:alt" content={description} />

        {!usesCustomOgImage && (
          <>
            <meta property="og:image" content={ogImageDefaultPath} />
            <meta property="og:image:url" content={ogImageDefaultPath} />
            <meta name="twitter:image" content={ogImageDefaultPath} />
            <meta
              property="og:image:type"
              content={`image/${getFileExtension(ogImageDefaultPath) ?? "png"}`}
            />
          </>
        )}

        {cfg.baseUrl && (
          <>
            <meta property="twitter:domain" content={cfg.baseUrl}></meta>
            <meta property="og:url" content={socialUrl}></meta>
            <meta property="twitter:url" content={socialUrl}></meta>
          </>
        )}

        <link rel="icon" href={iconPath} />
        <meta name="description" content={description} />
        <meta name="generator" content="Quartz" />

        {css.map((resource) => CSSResourceToStyleElement(resource, true))}
        {js
          .filter((resource) => resource.loadTime === "beforeDOMReady")
          .map((res) => JSResourceToScriptElement(res, true))}
        {additionalHead.map((resource) => {
          if (typeof resource === "function") {
            return resource(fileData)
          } else {
            return resource
          }
        })}
        <script src="https://cdn.jsdelivr.net/npm/3d-force-graph@1/dist/3d-force-graph.min.js" defer></script>
        <script dangerouslySetInnerHTML={{__html: `
(function() {
  // 팝업 모달 생성
  function createModal() {
    if (document.getElementById('graph-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'graph-modal';
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:10000;flex-direction:column;align-items:center;justify-content:center;';
    modal.innerHTML = '<div style="position:relative;width:90vw;height:85vh;background:#0d1b2a;border-radius:12px;overflow:hidden;">' +
      '<button id="graph-modal-close" style="position:absolute;top:12px;right:16px;z-index:1;background:rgba(91,184,212,0.3);border:none;color:#fff;font-size:20px;width:32px;height:32px;border-radius:50%;cursor:pointer;line-height:1;">×</button>' +
      '<div id="local-3d-graph-modal"></div>' +
    '</div>';
    document.body.appendChild(modal);
    document.getElementById('graph-modal-close').addEventListener('click', () => { modal.style.display = 'none'; });
    modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
  }

  function buildGraph(el, nodes, links, width, height) {
    if (typeof ForceGraph3D === 'undefined') return;
    ForceGraph3D()(el)
      .graphData({ nodes, links })
      .nodeLabel('name')
      .nodeColor(n => n.isCurrent ? '#ffcc00' : '#5bb8d4')
      .nodeVal(n => n.isCurrent ? 4 : 2)
      .linkColor(() => 'rgba(91,184,212,0.4)')
      .linkWidth(0.5)
      .backgroundColor('#0d1b2a')
      .width(width)
      .height(height)
      .onNodeClick(n => { window.location.href = n.url; });
  }

  function initLocalGraph() {
    // data-slug 속성으로 현재 페이지 slug 읽기 (URL 인코딩 문제 없음)
    const slug = document.body.getAttribute('data-slug');
    if (!slug || slug === 'graph') return;

    const rightSidebar = document.querySelector('.sidebar.right');
    if (!rightSidebar) return;

    createModal();

    const container = document.createElement('div');
    container.id = 'local-3d-graph-container';
    container.innerHTML = '<div class="local-graph-title">연결된 페이지 <span id="local-graph-expand" style="cursor:pointer;font-size:0.75rem;color:#7bb8d4;margin-left:6px;">⛶ 크게보기</span></div><div id="local-3d-graph"></div>';
    rightSidebar.prepend(container);

    fetch('/bipa-wiki/static/contentIndex.json')
      .then(r => r.json())
      .then(index => {
        if (!index[slug]) {
          container.querySelector('#local-3d-graph').innerHTML = '<div class="local-graph-empty">연결된 페이지가 없습니다.</div>';
          return;
        }
        const neighbors = new Set(index[slug].links || []);
        Object.entries(index).forEach(([s, info]) => {
          if (info.links && info.links.includes(slug)) neighbors.add(s);
        });
        neighbors.add(slug);

        const nodes = [...neighbors].map(s => ({
          id: s,
          name: (index[s] && index[s].title) || s.split('/').pop(),
          url: '/bipa-wiki/' + s,
          isCurrent: s === slug
        }));
        const links = [];
        neighbors.forEach(s => {
          ((index[s] && index[s].links) || []).forEach(t => {
            if (neighbors.has(t)) links.push({ source: s, target: t });
          });
        });

        const el = document.getElementById('local-3d-graph');
        buildGraph(el, nodes, links, el.clientWidth || 280, 240);

        // 크게보기 버튼
        document.getElementById('local-graph-expand').addEventListener('click', () => {
          const modal = document.getElementById('graph-modal');
          const modalEl = document.getElementById('local-3d-graph-modal');
          modalEl.innerHTML = '';
          modal.style.display = 'flex';
          buildGraph(modalEl, nodes, links, Math.round(window.innerWidth * 0.88), Math.round(window.innerHeight * 0.83));
        });
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLocalGraph);
  } else {
    setTimeout(initLocalGraph, 100);
  }
})();
        `}} />
      </head>
    )
  }

  return Head
}) satisfies QuartzComponentConstructor
