---
title: 3D 지식 그래프
---

<div id="graph-controls" style="margin-bottom:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
  <input id="graph-search" type="text" placeholder="노드 검색..." style="padding:6px 12px;border:1px solid #c8e6f5;border-radius:6px;font-size:14px;background:#fff;color:#1a2f3a;outline:none;" />
  <span id="graph-info" style="font-size:13px;color:#7bb8d4;"></span>
</div>
<div id="3d-graph" style="width:100%;height:78vh;border-radius:12px;overflow:hidden;background:#0d1b2a;"></div>

<script src="https://cdn.jsdelivr.net/npm/3d-force-graph@1/dist/3d-force-graph.min.js"></script>
<script>
(function() {
  const BASE = '/bipa-wiki';

  function slugToTitle(slug) {
    return slug.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  fetch(BASE + '/static/contentIndex.json')
    .then(r => r.json())
    .then(index => {
      const nodeMap = {};
      const links = [];

      Object.entries(index).forEach(([slug, info]) => {
        nodeMap[slug] = {
          id: slug,
          name: info.title || slugToTitle(slug),
          url: BASE + '/' + slug,
          linkCount: 0
        };
      });

      Object.entries(index).forEach(([slug, info]) => {
        (info.links || []).forEach(target => {
          if (nodeMap[target]) {
            links.push({ source: slug, target });
            nodeMap[slug].linkCount++;
            nodeMap[target].linkCount++;
          }
        });
      });

      const nodes = Object.values(nodeMap);
      const infoEl = document.getElementById('graph-info');
      infoEl.textContent = `노드 ${nodes.length}개 · 링크 ${links.length}개`;

      const Graph = ForceGraph3D()(document.getElementById('3d-graph'))
        .graphData({ nodes, links })
        .nodeLabel('name')
        .nodeColor(node => node.linkCount > 3 ? '#5bb8d4' : node.linkCount > 1 ? '#1a7fa8' : '#7bb8d4')
        .nodeVal(node => Math.max(1, node.linkCount) * 1.5)
        .linkColor(() => 'rgba(91,184,212,0.3)')
        .linkWidth(0.5)
        .backgroundColor('#0d1b2a')
        .onNodeClick(node => { window.location.href = node.url; })
        .onNodeHover(node => {
          document.getElementById('3d-graph').style.cursor = node ? 'pointer' : 'default';
        });

      // 검색
      document.getElementById('graph-search').addEventListener('input', function() {
        const q = this.value.toLowerCase();
        Graph.nodeColor(node =>
          q && node.name.toLowerCase().includes(q) ? '#ffcc00'
          : node.linkCount > 3 ? '#5bb8d4'
          : node.linkCount > 1 ? '#1a7fa8'
          : '#7bb8d4'
        );
      });
    });
})();
</script>
