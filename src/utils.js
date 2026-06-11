// GeoGenius Canvas Utilities
// Shared drawing helpers to be used by all Canvas-based topics.
// Phase 1: documents the API contract extracted from e2.js.
// Phase 2 (full refactor): each topic will call ggHelpers(ctx) instead of defining its own closures.

/**
 * ease-in-out easing: t ∈ [0,1]
 * @param {number} t
 * @returns {number}
 */
function ggEase(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Returns a set of Canvas 2D drawing helpers bound to a given rendering context.
 * Every helper saves/restores ctx state so callers don't need to.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @returns {{fillPoly, label, dashedLine, solidLine, rightAngle, dot, roundRect}}
 */
function ggHelpers(ctx) {
  return {
    /** Fill (and optionally stroke) a polygon from an array of [x,y] points */
    fillPoly(pts, fill, strokeColor, lw) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (strokeColor) { ctx.strokeStyle = strokeColor; ctx.lineWidth = lw || 2; ctx.stroke(); }
    },

    /** Centered text label */
    label(text, x, y, color, size, align) {
      ctx.save();
      ctx.fillStyle = color || '#333';
      ctx.font = `600 ${size || 13}px 'Noto Sans SC',sans-serif`;
      ctx.textAlign = align || 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y);
      ctx.restore();
    },

    /** Dashed line */
    dashedLine(x1, y1, x2, y2, color, lw, dash) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw || 1.8;
      ctx.setLineDash(dash || [5, 3]);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    },

    /** Solid line */
    solidLine(x1, y1, x2, y2, color, lw) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw || 2;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.restore();
    },

    /** Right-angle mark (small L-bracket at corner) */
    rightAngle(x, y, sz, col) {
      ctx.save();
      ctx.strokeStyle = col || '#C03030';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x, y - sz); ctx.lineTo(x + sz, y - sz); ctx.lineTo(x + sz, y);
      ctx.stroke();
      ctx.restore();
    },

    /** Filled circle */
    dot(x, y, r, color) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },

    /** Rounded rectangle */
    roundRect(x, y, w, h, r, fill, strokeColor, lw) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (strokeColor) { ctx.strokeStyle = strokeColor; ctx.lineWidth = lw || 1.5; ctx.stroke(); }
      ctx.restore();
    },
  };
}
