import { useRef, useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

interface GraphNode {
  uuid: string;
  name: string;
  node_type: string;
  labels?: string[];
  summary?: string;
}

interface GraphEdge {
  uuid: string;
  name?: string;
  source_node_uuid: string;
  target_node_uuid: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  degree: number;
  radius: number;
  color: string;
}

const REPULSION = 3200;
const SPRING_K  = 0.028;
const REST_LEN  = 95;
const DAMPING   = 0.82;
const GRAVITY   = 0.006;

function nodeColor(n: GraphNode): string {
  if (n.node_type === "episode") return "#3b82f6";
  const lab = (n.labels ?? []).join(" ").toLowerCase();
  if (lab.includes("person") || lab.includes("human")) return "#f97316";
  return "#22c55e";
}

function nodeRadius(degree: number, type: string): number {
  const base = type === "episode" ? 9 : 7;
  return base + Math.min(degree * 2.5, 14);
}

export function KnowledgeGraphCanvas({ className }: { className?: string }) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const animRef      = useRef<number>(0);
  const simNodes     = useRef<SimNode[]>([]);
  const simEdges     = useRef<GraphEdge[]>([]);
  const nodeMap      = useRef<Map<string, SimNode>>(new Map());
  const transform    = useRef({ x: 0, y: 0, scale: 1 });
  const dragRef      = useRef<{ sx: number; sy: number; tx: number; ty: number; moved: boolean } | null>(null);
  const pinchRef     = useRef<number | null>(null);
  const initialized  = useRef(false);

  const [hovered,    setHovered]    = useState<SimNode | null>(null);
  const [selected,   setSelected]   = useState<SimNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isTouch,    setIsTouch]    = useState(false);

  useEffect(() => {
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  const { data, isLoading, isError } = useQuery<GraphData>({
    queryKey: ["/api/graph/data"],
  });

  // Build simulation nodes once data arrives
  useEffect(() => {
    if (!data || !canvasRef.current || initialized.current) return;
    initialized.current = true;

    const canvas = canvasRef.current;
    const w = canvas.offsetWidth  || 600;
    const h = canvas.offsetHeight || 400;

    const degrees = new Map<string, number>();
    data.edges.forEach(e => {
      degrees.set(e.source_node_uuid, (degrees.get(e.source_node_uuid) ?? 0) + 1);
      degrees.set(e.target_node_uuid, (degrees.get(e.target_node_uuid) ?? 0) + 1);
    });

    const total = data.nodes.length;
    const nodes: SimNode[] = data.nodes.map((node, i) => {
      const angle = (i / total) * Math.PI * 2;
      const deg   = degrees.get(node.uuid) ?? 0;
      return {
        ...node,
        x:      w / 2 + Math.cos(angle) * 180,
        y:      h / 2 + Math.sin(angle) * 180,
        vx:     (Math.random() - 0.5) * 2,
        vy:     (Math.random() - 0.5) * 2,
        degree: deg,
        radius: nodeRadius(deg, node.node_type),
        color:  nodeColor(node),
      };
    });

    simNodes.current = nodes;
    simEdges.current = data.edges;
    const map = new Map<string, SimNode>();
    nodes.forEach(n => map.set(n.uuid, n));
    nodeMap.current = map;
  }, [data]);

  // Animation + render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cvs = canvas;
    const ctx = cvs.getContext("2d")!;

    function tick() {
      const nodes = simNodes.current;
      const edges = simEdges.current;
      const nmap  = nodeMap.current;

      if (nodes.length) {
        const cx = cvs.width  / 2;
        const cy = cvs.height / 2;

        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const ni = nodes[i], nj = nodes[j];
            const dx = nj.x - ni.x;
            const dy = nj.y - ni.y;
            const d2 = dx * dx + dy * dy + 1;
            const d  = Math.sqrt(d2);
            const f  = REPULSION / d2;
            const fx = f * dx / d, fy = f * dy / d;
            ni.vx -= fx; ni.vy -= fy;
            nj.vx += fx; nj.vy += fy;
          }
        }

        for (const e of edges) {
          const s = nmap.get(e.source_node_uuid);
          const t = nmap.get(e.target_node_uuid);
          if (!s || !t) continue;
          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const d  = Math.sqrt(dx * dx + dy * dy) + 0.1;
          const f  = (d - REST_LEN) * SPRING_K;
          s.vx += f * dx / d; s.vy += f * dy / d;
          t.vx -= f * dx / d; t.vy -= f * dy / d;
        }

        for (const n of nodes) {
          n.vx += (cx - n.x) * GRAVITY;
          n.vy += (cy - n.y) * GRAVITY;
          n.vx *= DAMPING; n.vy *= DAMPING;
          n.x  += n.vx;   n.y  += n.vy;
        }
      }

      ctx.clearRect(0, 0, cvs.width, cvs.height);
      const tr = transform.current;
      ctx.save();
      ctx.translate(tr.x, tr.y);
      ctx.scale(tr.scale, tr.scale);

      // Edges
      ctx.strokeStyle = "rgba(131,238,240,0.14)";
      ctx.lineWidth   = 1;
      for (const e of simEdges.current) {
        const s = nodeMap.current.get(e.source_node_uuid);
        const t = nodeMap.current.get(e.target_node_uuid);
        if (!s || !t) continue;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.stroke();
      }

      // Nodes + labels
      for (const n of simNodes.current) {
        const r = n.radius;
        const isActive = n.uuid === (hovered?.uuid ?? selected?.uuid);

        // Glow ring for active node
        if (isActive) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 5, 0, Math.PI * 2);
          ctx.fillStyle = n.color + "22";
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle   = isActive ? n.color + "ee" : n.color + "bb";
        ctx.fill();
        ctx.strokeStyle = isActive ? n.color : n.color + "99";
        ctx.lineWidth   = isActive ? 2 : 1.5;
        ctx.stroke();

        // Labels — always show for larger nodes, show for all on touch devices
        const showLabel = r >= 7;
        if (showLabel) {
          const maxCh = Math.floor(r * 1.8);
          const label = n.name.length > maxCh ? n.name.slice(0, maxCh) + "…" : n.name;
          const fs    = Math.max(9, Math.min(11, r * 0.9));
          ctx.font      = `${fs}px Inter, sans-serif`;
          ctx.fillStyle = isActive ? "rgba(212,233,243,0.96)" : "rgba(212,233,243,0.65)";
          ctx.textAlign = "center";
          ctx.fillText(label, n.x, n.y + r + fs + 2);
        }
      }

      ctx.restore();
      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep canvas pixel size matched to container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        canvas.width  = entry.contentRect.width;
        canvas.height = entry.contentRect.height;
      }
    });
    ro.observe(parent);
    canvas.width  = parent.offsetWidth;
    canvas.height = parent.offsetHeight;
    return () => ro.disconnect();
  }, []);

  // ── Coordinate helpers ───────────────────────────────────────────────────────
  const screenToGraph = useCallback((mx: number, my: number) => {
    const tr = transform.current;
    return { gx: (mx - tr.x) / tr.scale, gy: (my - tr.y) / tr.scale };
  }, []);

  const hitTest = useCallback((mx: number, my: number, extraRadius = 0): SimNode | null => {
    const { gx, gy } = screenToGraph(mx, my);
    return simNodes.current.find(n => {
      const dx = n.x - gx, dy = n.y - gy;
      const r = n.radius + extraRadius;
      return dx * dx + dy * dy <= r * r;
    }) ?? null;
  }, [screenToGraph]);

  // ── Mouse handlers ───────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (dragRef.current) {
      dragRef.current.moved = true;
      transform.current.x = dragRef.current.tx + (mx - dragRef.current.sx);
      transform.current.y = dragRef.current.ty + (my - dragRef.current.sy);
      return;
    }

    const hit = hitTest(mx, my);
    setHovered(hit);
    if (hit) setTooltipPos({ x: mx, y: my });
  }, [hitTest]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    dragRef.current = {
      sx: e.clientX - rect.left,
      sy: e.clientY - rect.top,
      tx: transform.current.x,
      ty: transform.current.y,
      moved: false,
    };
  }, []);

  const handleMouseUp = useCallback(() => { dragRef.current = null; }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const factor = e.deltaY < 0 ? 1.12 : 0.9;
    const rect   = canvas.getBoundingClientRect();
    const mx     = e.clientX - rect.left;
    const my     = e.clientY - rect.top;
    const tr     = transform.current;
    tr.x     = mx - (mx - tr.x) * factor;
    tr.y     = my - (my - tr.y) * factor;
    tr.scale = Math.max(0.25, Math.min(4, tr.scale * factor));
  }, []);

  // ── Touch handlers ───────────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (e.touches.length === 1) {
      dragRef.current = {
        sx: e.touches[0].clientX - rect.left,
        sy: e.touches[0].clientY - rect.top,
        tx: transform.current.x,
        ty: transform.current.y,
        moved: false,
      };
      pinchRef.current = null;
    } else if (e.touches.length === 2) {
      dragRef.current = null;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (e.touches.length === 1 && dragRef.current) {
      const mx = e.touches[0].clientX - rect.left;
      const my = e.touches[0].clientY - rect.top;
      const dx = mx - dragRef.current.sx;
      const dy = my - dragRef.current.sy;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragRef.current.moved = true;
      transform.current.x = dragRef.current.tx + dx;
      transform.current.y = dragRef.current.ty + dy;
    } else if (e.touches.length === 2 && pinchRef.current !== null) {
      const dx   = e.touches[0].clientX - e.touches[1].clientX;
      const dy   = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const f    = dist / pinchRef.current;

      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
      const tr = transform.current;
      tr.x     = mx - (mx - tr.x) * f;
      tr.y     = my - (my - tr.y) * f;
      tr.scale = Math.max(0.25, Math.min(4, tr.scale * f));
      pinchRef.current = dist;
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;

    // Tap = no drag movement → toggle selected node
    if (canvas && dragRef.current && !dragRef.current.moved) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.changedTouches[0];
      const mx = touch.clientX - rect.left;
      const my = touch.clientY - rect.top;
      const hit = hitTest(mx, my, 8); // extra 8px touch slop
      setSelected(prev => (hit && prev?.uuid !== hit.uuid ? hit : null));
      if (hit) setTooltipPos({ x: mx, y: my });
    }

    if (e.touches.length === 0) {
      dragRef.current = null;
      pinchRef.current = null;
    }
  }, [hitTest]);

  // ── Active tooltip node (hover on desktop, selected on touch) ───────────────
  const activeNode = isTouch ? selected : hovered;

  // ── Zoom controls ────────────────────────────────────────────────────────────
  const zoomIn  = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.offsetWidth  / 2;
    const cy = canvas.offsetHeight / 2;
    const tr = transform.current;
    const f  = 1.3;
    tr.x     = cx - (cx - tr.x) * f;
    tr.y     = cy - (cy - tr.y) * f;
    tr.scale = Math.min(4, tr.scale * f);
  }, []);

  const zoomOut = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.offsetWidth  / 2;
    const cy = canvas.offsetHeight / 2;
    const tr = transform.current;
    const f  = 1 / 1.3;
    tr.x     = cx - (cx - tr.x) * f;
    tr.y     = cy - (cy - tr.y) * f;
    tr.scale = Math.max(0.25, tr.scale * f);
  }, []);

  const zoomReset = useCallback(() => {
    transform.current = { x: 0, y: 0, scale: 1 };
  }, []);

  const { t } = useTranslation();

  // ── Render ───────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={`${className ?? ""} flex items-center justify-center bg-[#00080c]`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-[#83eef0] border-t-transparent rounded-full animate-spin" />
          <span className="text-[11px] text-[#83eef066] [font-family:'Inter',Helvetica]">{t("graph.loadingGraph")}</span>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={`${className ?? ""} flex items-center justify-center bg-[#00080c]`}>
        <span className="text-[11px] text-[#d4e9f333] [font-family:'Inter',Helvetica]">{t("graph.graphUnavailable")}</span>
      </div>
    );
  }

  return (
    <div
      className={`${className ?? ""} relative select-none`}
      style={{ cursor: dragRef.current ? "grabbing" : "grab", background: "#00080c" }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ touchAction: "none" }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Tooltip — hover on desktop, tap on mobile */}
      {activeNode && (
        <div
          className="pointer-events-none absolute z-10 max-w-[220px] rounded-2xl border border-[#83eef020] shadow-xl"
          style={{
            left: Math.min(tooltipPos.x + 14, (canvasRef.current?.offsetWidth ?? 300) - 230),
            top:  Math.max(tooltipPos.y - 24, 8),
            background:     "rgba(0,8,15,0.96)",
            backdropFilter: "blur(14px)",
            fontFamily: "Inter, sans-serif",
            padding: "10px 13px",
            border: `1px solid ${activeNode.color}33`,
            boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 0.5px ${activeNode.color}22`,
          }}
        >
          <div
            className="font-semibold text-[12px] mb-0.5 leading-tight"
            style={{ color: activeNode.color }}
          >
            {activeNode.name}
          </div>
          <div className="text-[8px] uppercase tracking-widest text-[#d4e9f344] mb-1.5">
            {activeNode.node_type}
          </div>
          {activeNode.summary && (
            <div
              className="text-[10px] text-[#d4e9f399] leading-relaxed"
              style={{ display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}
            >
              {activeNode.summary}
            </div>
          )}
          {isTouch && (
            <div className="text-[8px] text-[#d4e9f322] mt-2">Tap again to dismiss</div>
          )}
        </div>
      )}

      {/* Zoom controls — top-right, matching Bonfires layout */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
        <button
          onPointerDown={e => { e.stopPropagation(); zoomIn(); }}
          aria-label="Zoom in"
          data-testid="button-zoom-in"
          className="w-7 h-7 flex items-center justify-center rounded-md border border-[#83eef022] text-[#d4e9f388] hover:text-[#83eef0] hover:border-[#83eef055] hover:bg-[#83eef00a] transition-colors text-base leading-none select-none"
          style={{ background: "rgba(0,8,15,0.80)", backdropFilter: "blur(8px)" }}
        >+</button>
        <button
          onPointerDown={e => { e.stopPropagation(); zoomReset(); }}
          aria-label="Reset zoom"
          data-testid="button-zoom-reset"
          className="w-7 h-7 flex items-center justify-center rounded-md border border-[#83eef022] text-[#d4e9f355] hover:text-[#83eef0] hover:border-[#83eef055] hover:bg-[#83eef00a] transition-colors text-[9px] leading-none select-none"
          style={{ background: "rgba(0,8,15,0.80)", backdropFilter: "blur(8px)" }}
        >⊙</button>
        <button
          onPointerDown={e => { e.stopPropagation(); zoomOut(); }}
          aria-label="Zoom out"
          data-testid="button-zoom-out"
          className="w-7 h-7 flex items-center justify-center rounded-md border border-[#83eef022] text-[#d4e9f388] hover:text-[#83eef0] hover:border-[#83eef055] hover:bg-[#83eef00a] transition-colors text-base leading-none select-none"
          style={{ background: "rgba(0,8,15,0.80)", backdropFilter: "blur(8px)" }}
        >−</button>
      </div>

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-2.5 left-3 flex items-center gap-3">
        {([["#3b82f6", "Episode"], ["#22c55e", "Entity"], ["#f97316", "Person"]] as const).map(([c, l]) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c }} />
            <span className="text-[9px] text-[#d4e9f355] [font-family:'Inter',Helvetica]">{l}</span>
          </div>
        ))}
      </div>

      {/* Interaction hint */}
      <div className="pointer-events-none absolute bottom-2.5 right-3 text-[8px] text-[#d4e9f322] [font-family:'Inter',Helvetica]">
        {isTouch ? t("graph.pinchToZoom") : t("graph.scrollToZoom")}
      </div>

      {/* Node count */}
      <div className="pointer-events-none absolute top-3 left-3 text-[8px] text-[#83eef033] [font-family:'Inter',Helvetica] tabular-nums">
        {data.nodes.length} {t("dashboard.nodes")} · {data.edges.length} {t("dashboard.edges")}
      </div>
    </div>
  );
}
