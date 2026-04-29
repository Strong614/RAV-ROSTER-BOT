import { createCanvas, loadImage } from "canvas";

const RANK_ORDER = [
  "Vanguard Supreme",
  "Phantom Leader",
  "Phantom Regent",
  "Night Council",
  "Black Sigil",
  "Spectre",
  "Revenant",
  "Vantage",
  "Dagger",
  "Neophyte"
];

const RANK_LEVELS = {
  "Vanguard Supreme": 10,
  "Phantom Leader":    9,
  "Phantom Regent":    8,
  "Night Council":     7,
  "Black Sigil":       6,
  "Spectre":           4,
  "Revenant":          3,
  "Vantage":           2,
  "Dagger":            1,
  "Neophyte":          0
};

const HONORARY_RANK = "Honorary";

const SUB_GROUPS = {
  "Head Office":     ["Vanguard Supreme", "Phantom Leader", "Phantom Regent"],
  "Management Team": ["Night Council", "Black Sigil"],
  "RAV Members":     ["Spectre", "Revenant", "Vantage", "Dagger", "Neophyte"]
};

// One accent color + readable text per sub-group — no gradients needed
const SUBGROUP_STYLE = {
  "Head Office":     { accent: "#c89828", text: "#ffeebb", border: "rgba(200,152,40,0.5)"  },
  "Management Team": { accent: "#20a8d0", text: "#b0e8f8", border: "rgba(32,168,208,0.5)"  },
  "RAV Members":     { accent: "#4878d8", text: "#b0c8ff", border: "rgba(72,120,216,0.5)"  },
};

function getSubGroupLabel(rank) {
  for (const [label, ranks] of Object.entries(SUB_GROUPS)) {
    if (ranks[0] === rank) return label;
  }
  return null;
}

function getRankSubGroup(rank) {
  for (const [label, ranks] of Object.entries(SUB_GROUPS)) {
    if (ranks.includes(rank)) return label;
  }
  return "RAV Members";
}

function isFirstInGroup(rank) {
  return getSubGroupLabel(rank) !== null;
}

// Simple rounded-rect path (uniform radius only — avoids per-corner branching)
function rRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x,     y,     x + r, y,         r);
  ctx.closePath();
}

// Rounded rect with rounded top corners only (for the strip)
function rRectTop(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x,     y + h);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export async function generateRosterCanvas(rosterData) {
  // ── Canvas & layout constants ─────────────────────────────────────────────
  const WIDTH          = 4000;

  const BOX_W          = 380;
  const BOX_H          = 200;
  const STRIP_H        = 68;  // top stripe inside each box
  const BOX_GAP        = 24;
  const ROW_GAP        = 20;
  const CORNER_R       = 10;

  const HON_PANEL_W    = 460;
  const TREE_OFFSET_X  = HON_PANEL_W + 80;
  const TREE_W         = WIDTH - TREE_OFFSET_X - 50;

  const MAX_PER_ROW    = Math.max(1, Math.floor((TREE_W + BOX_GAP) / (BOX_W + BOX_GAP)));

  const HEADER_H       = 260;
  const FOOTER_H       = 100;
  const BANNER_H       = 100; // height reserved for each sub-group divider

  function rankBlockH(n) {
    const rows = Math.ceil(n / MAX_PER_ROW);
    return rows * BOX_H + (rows - 1) * ROW_GAP + 70;
  }

  // ── Data ──────────────────────────────────────────────────────────────────
  const totalMembers    = Object.values(rosterData).reduce((s, m) => s + m.length, 0);
  const ranksPresent    = RANK_ORDER.filter(r => rosterData[r]?.length > 0);
  const honoraryMembers = rosterData[HONORARY_RANK] || [];

  // ── Height pre-pass ───────────────────────────────────────────────────────
  let totalContentH = 0;
  ranksPresent.forEach(rank => {
    if (getSubGroupLabel(rank)) totalContentH += BANNER_H;
    totalContentH += rankBlockH(rosterData[rank]?.length || 0);
  });
  const HEIGHT = HEADER_H + totalContentH + FOOTER_H;

  // ── Canvas setup ──────────────────────────────────────────────────────────
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx    = canvas.getContext("2d");

  // Background — simple dark gradient, no texture loop
  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bg.addColorStop(0, "#141820");
  bg.addColorStop(1, "#0c0e14");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Outer border — plain rect, no shadow
  ctx.strokeStyle = "rgba(162,198,202,0.35)";
  ctx.lineWidth   = 3;
  ctx.strokeRect(20, 20, WIDTH - 40, HEIGHT - 40);

  // ── Header ────────────────────────────────────────────────────────────────
  ctx.fillStyle = "#a8d8dc";
  ctx.font      = "bold 86px 'Times New Roman'";
  ctx.textAlign = "center";
  ctx.fillText("RAV ROSTER", WIDTH / 2, 120);

  const now     = new Date();
  const dateStr = now.toLocaleDateString("en-GB");
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  ctx.fillStyle = "#6a8a8e";
  ctx.font      = "34px 'Times New Roman'";
  ctx.fillText(`${totalMembers} active members  ·  ${dateStr} at ${timeStr}`, WIDTH / 2, 170);

  // Header divider
  ctx.strokeStyle = "rgba(162,198,202,0.25)";
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(60, 200);
  ctx.lineTo(WIDTH - 60, 200);
  ctx.stroke();

  // Logo
  try {
    const logo = await loadImage("./assets/rav_logo.png");
    ctx.globalAlpha = 0.85;
    ctx.drawImage(logo, WIDTH - 420, 16, 380, 380);
    ctx.globalAlpha = 1;
  } catch (err) {
    console.error("Logo not found:", err);
  }

  // ── Honorary panel ────────────────────────────────────────────────────────
  const HON_BOX_W   = 400;
  const HON_BOX_H   = 190;
  const HON_PAN_X   = 30;
  const HON_GAP     = 18;
  const HON_START_Y = HEADER_H + 60;

  if (honoraryMembers.length > 0) {
    ctx.fillStyle = "#c084fc";
    ctx.font      = "bold 44px 'Times New Roman'";
    ctx.textAlign = "center";
    ctx.fillText("HONORARY", HON_PAN_X + HON_PANEL_W / 2, HON_START_Y - 18);

    ctx.strokeStyle = "rgba(192,132,252,0.5)";
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(HON_PAN_X + 20, HON_START_Y - 4);
    ctx.lineTo(HON_PAN_X + HON_PANEL_W - 20, HON_START_Y - 4);
    ctx.stroke();

    honoraryMembers.forEach((member, idx) => {
      const bx = HON_PAN_X + (HON_PANEL_W - HON_BOX_W) / 2;
      const by = HON_START_Y + 16 + idx * (HON_BOX_H + HON_GAP);

      // Box — flat dark purple
      rRect(ctx, bx, by, HON_BOX_W, HON_BOX_H, CORNER_R);
      ctx.fillStyle = "#2a1040";
      ctx.fill();
      rRect(ctx, bx, by, HON_BOX_W, HON_BOX_H, CORNER_R);
      ctx.strokeStyle = "rgba(192,100,255,0.55)";
      ctx.lineWidth   = 2;
      ctx.stroke();

      // Top strip
      rRectTop(ctx, bx, by, HON_BOX_W, 62, CORNER_R);
      ctx.fillStyle = "#3d0870";
      ctx.fill();

      ctx.strokeStyle = "rgba(192,100,255,0.3)";
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(bx + 8, by + 62);
      ctx.lineTo(bx + HON_BOX_W - 8, by + 62);
      ctx.stroke();

      // 4px accent bar at very top
      rRectTop(ctx, bx, by, HON_BOX_W, 5, CORNER_R);
      ctx.fillStyle = "#c084fc";
      ctx.fill();

      ctx.fillStyle = "#e4b8ff";
      ctx.font      = "bold 30px 'Times New Roman'";
      ctx.textAlign = "center";
      ctx.fillText("HONORARY", bx + HON_BOX_W / 2, by + 46);

      ctx.fillStyle = "#f0e0ff";
      ctx.font      = "bold 42px 'Times New Roman'";
      const honName = member.name.length > 17 ? member.name.substring(0, 15) + "…" : member.name;
      ctx.fillText(honName, bx + HON_BOX_W / 2, by + 118);

      ctx.fillStyle = "#9050c0";
      ctx.font      = "italic 28px 'Times New Roman'";
      const honUser = `@${member.username}`;
      ctx.fillText(honUser.length > 20 ? honUser.substring(0, 18) + "…" : honUser,
        bx + HON_BOX_W / 2, by + 160);
    });
  }

  // ── Main org chart ────────────────────────────────────────────────────────
  let currentY    = HEADER_H + 30;
  let prevBottomY = 0;
  let prevCenterX = 0;

  ranksPresent.forEach((rank, rankIndex) => {
    const members     = rosterData[rank];
    if (!members?.length) return;

    const memberCount = members.length;
    const rows        = Math.ceil(memberCount / MAX_PER_ROW);
    const blockH      = rankBlockH(memberCount);
    const treeCenterX = TREE_OFFSET_X + TREE_W / 2;
    const style       = SUBGROUP_STYLE[getRankSubGroup(rank)];

    // ── Sub-group divider — simple rule + label + rule ──────────────────
    const groupLabel = getSubGroupLabel(rank);
    if (groupLabel) {
      const divY = currentY + BANNER_H / 2 - 8;

      ctx.font = "bold 68px 'Times New Roman'";
      const label  = groupLabel.toUpperCase();
      const textW  = ctx.measureText(label).width;
      const padX   = 36;
      const lineY  = divY + 10;

      // Left rule
      ctx.strokeStyle = style.accent;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(TREE_OFFSET_X + 16, lineY);
      ctx.lineTo(treeCenterX - textW / 2 - padX, lineY);
      ctx.stroke();

      // Right rule
      ctx.beginPath();
      ctx.moveTo(treeCenterX + textW / 2 + padX, lineY);
      ctx.lineTo(TREE_OFFSET_X + TREE_W - 16, lineY);
      ctx.stroke();

      // Label
      ctx.fillStyle = style.accent;
      ctx.textAlign = "center";
      ctx.fillText(label, treeCenterX, divY + 6);

      currentY += BANNER_H;
    }

    // ── Connecting lines (no shadow) ─────────────────────────────────────
    if (rankIndex > 0 && !isFirstInGroup(rank) && prevBottomY > 0) {
      const fCount  = Math.min(memberCount, MAX_PER_ROW);
      const fWidth  = fCount * BOX_W + (fCount - 1) * BOX_GAP;
      const fStartX = TREE_OFFSET_X + (TREE_W - fWidth) / 2;

      ctx.strokeStyle = "#5a9ca8";
      ctx.lineWidth   = 5;
      ctx.lineCap     = "round";

      ctx.beginPath();
      ctx.moveTo(prevCenterX, prevBottomY);
      ctx.lineTo(prevCenterX, currentY - 14);
      ctx.stroke();

      if (memberCount > 1) {
        ctx.beginPath();
        ctx.moveTo(fStartX + BOX_W / 2, currentY - 18);
        ctx.lineTo(fStartX + fWidth - BOX_W / 2, currentY - 18);
        ctx.stroke();
      }

      for (let i = 0; i < fCount; i++) {
        const lx = fStartX + i * (BOX_W + BOX_GAP) + BOX_W / 2;
        ctx.beginPath();
        ctx.moveTo(lx, currentY - 18);
        ctx.lineTo(lx, currentY);
        ctx.stroke();
      }
    }

    // ── Member boxes ─────────────────────────────────────────────────────
    for (let row = 0; row < rows; row++) {
      const rowMembers = members.slice(row * MAX_PER_ROW, (row + 1) * MAX_PER_ROW);
      const rowCount   = rowMembers.length;
      const rowW       = rowCount * BOX_W + (rowCount - 1) * BOX_GAP;
      const rowStartX  = TREE_OFFSET_X + (TREE_W - rowW) / 2;
      const rowY       = currentY + row * (BOX_H + ROW_GAP);

      rowMembers.forEach((member, i) => {
        const globalIdx = row * MAX_PER_ROW + i;
        const x = rowStartX + i * (BOX_W + BOX_GAP);
        const y = rowY;

        // Box — flat dark fill, single colored border
        rRect(ctx, x, y, BOX_W, BOX_H, CORNER_R);
        ctx.fillStyle = "#1a2830";
        ctx.fill();
        rRect(ctx, x, y, BOX_W, BOX_H, CORNER_R);
        ctx.strokeStyle = style.border;
        ctx.lineWidth   = 2;
        ctx.stroke();

        // Top strip (slightly lighter)
        rRectTop(ctx, x, y, BOX_W, STRIP_H, CORNER_R);
        ctx.fillStyle = "#1e3040";
        ctx.fill();

        // Strip/body separator
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(x + 8, y + STRIP_H);
        ctx.lineTo(x + BOX_W - 8, y + STRIP_H);
        ctx.stroke();

        // Sub-group accent bar — thin top line
        rRectTop(ctx, x, y, BOX_W, 5, CORNER_R);
        ctx.fillStyle = style.accent;
        ctx.fill();

        // ── Level + count badges (left of first box only) ───────────────
        if (globalIdx === 0) {
          ctx.font = "bold 32px 'Times New Roman'";
          const lvlText = `LVL ${RANK_LEVELS[rank] ?? "?"}`;
          const cntText = `× ${memberCount}`;
          const pillW   = Math.max(ctx.measureText(lvlText).width,
                                   ctx.measureText(cntText).width) + 28;
          const pillH   = 40;
          const pillGap = 8;
          const pillX   = x - pillW - 14;
          const lvlY    = y + BOX_H / 2 - pillH - pillGap / 2;
          const cntY    = y + BOX_H / 2 + pillGap / 2;

          // Level pill
          rRect(ctx, pillX, lvlY, pillW, pillH, 8);
          ctx.fillStyle = "#0a0e18";
          ctx.fill();
          rRect(ctx, pillX, lvlY, pillW, pillH, 8);
          ctx.strokeStyle = style.border;
          ctx.lineWidth   = 2;
          ctx.stroke();

          // Count pill
          rRect(ctx, pillX, cntY, pillW, pillH, 8);
          ctx.fillStyle = "#0a0e18";
          ctx.fill();
          rRect(ctx, pillX, cntY, pillW, pillH, 8);
          ctx.strokeStyle = style.border;
          ctx.lineWidth   = 2;
          ctx.stroke();

          ctx.fillStyle = style.text;
          ctx.font      = "bold 32px 'Times New Roman'";
          ctx.textAlign = "center";
          ctx.fillText(lvlText, pillX + pillW / 2, lvlY + pillH - 10);
          ctx.fillText(cntText, pillX + pillW / 2, cntY  + pillH - 10);
        }

        // ── Rank title (big + clear) ─────────────────────────────────────
        ctx.fillStyle = style.text;
        ctx.font      = "bold 44px 'Times New Roman'";
        ctx.textAlign = "center";
        const rankLabel = rank.length > 20 ? rank.substring(0, 18) + "…" : rank;
        ctx.fillText(rankLabel.toUpperCase(), x + BOX_W / 2, y + STRIP_H - 16);

        // ── Member name ──────────────────────────────────────────────────
        ctx.fillStyle = "#d8eef2";
        ctx.font      = "bold 44px 'Times New Roman'";
        const nameText = member.name.length > 18 ? member.name.substring(0, 16) + "…" : member.name;
        ctx.fillText(nameText, x + BOX_W / 2, y + STRIP_H + 68);

        // ── Username ─────────────────────────────────────────────────────
        ctx.fillStyle = "#4a8090";
        ctx.font      = "italic 30px 'Times New Roman'";
        const uText = `@${member.username}`;
        ctx.fillText(uText.length > 22 ? uText.substring(0, 20) + "…" : uText,
          x + BOX_W / 2, y + STRIP_H + 112);
      });
    }

    // Track bottom of this rank block for the next connecting line
    const lastRow    = rows - 1;
    const lastCount  = memberCount - lastRow * MAX_PER_ROW;
    const lastW      = lastCount * BOX_W + (lastCount - 1) * BOX_GAP;
    const lastStartX = TREE_OFFSET_X + (TREE_W - lastW) / 2;
    prevBottomY      = currentY + lastRow * (BOX_H + ROW_GAP) + BOX_H;
    prevCenterX      = lastStartX + lastW / 2;

    currentY += blockH;
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  ctx.strokeStyle = "rgba(162,198,202,0.15)";
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(80, HEIGHT - FOOTER_H + 8);
  ctx.lineTo(WIDTH - 80, HEIGHT - FOOTER_H + 8);
  ctx.stroke();

  ctx.fillStyle = "#4a6468";
  ctx.font      = "28px 'Times New Roman'";
  ctx.textAlign = "center";
  ctx.fillText(`Generated by RAV Roster Bot  ·  ${dateStr} at ${timeStr}`, WIDTH / 2, HEIGHT - 36);

  return canvas.toBuffer();
}
