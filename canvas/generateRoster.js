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

const SUBGROUP_STYLE = {
  "Head Office": {
    accent:    "#c89828",
    accentDim: "#7a5c10",
    text:      "#ffeebb",
    border:    "rgba(200,152,40,0.6)",
    stripA:    "#2e1e04",
    stripB:    "#4a3008",
  },
  "Management Team": {
    accent:    "#20a8d0",
    accentDim: "#0e5a70",
    text:      "#b0e8f8",
    border:    "rgba(32,168,208,0.6)",
    stripA:    "#061828",
    stripB:    "#0c3048",
  },
  "RAV Members": {
    accent:    "#5888e8",
    accentDim: "#243870",
    text:      "#c0d0ff",
    border:    "rgba(88,136,232,0.6)",
    stripA:    "#0c1430",
    stripB:    "#182248",
  },
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

// Rounded rect — uniform radius
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

// Rounded top corners only
function rRectTop(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x,     y + h);
  ctx.lineTo(x,     y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export async function generateRosterCanvas(rosterData) {

  // ── Layout ────────────────────────────────────────────────────────────────
  const WIDTH         = 8000;

  const BOX_W         = 500;
  const BOX_H         = 210;
  const STRIP_H       = 76;
  const BOX_GAP       = 36;
  const ROW_GAP       = 26;
  const CORNER_R      = 14;

  const HON_PANEL_W   = 580;
  const TREE_OFFSET_X = HON_PANEL_W + 90;
  const TREE_W        = WIDTH - TREE_OFFSET_X - 60;

  const MAX_PER_ROW   = Math.max(1, Math.floor((TREE_W + BOX_GAP) / (BOX_W + BOX_GAP)));

  const HEADER_H      = 300;
  const FOOTER_H      = 120;
  const BANNER_H      = 130;

  function rankBlockH(n) {
    const rows = Math.ceil(n / MAX_PER_ROW);
    return rows * BOX_H + (rows - 1) * ROW_GAP + 80;
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

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx    = canvas.getContext("2d");

  // ── Background ────────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bg.addColorStop(0, "#13161e");
  bg.addColorStop(1, "#0b0d12");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Outer border
  ctx.strokeStyle = "rgba(162,198,202,0.30)";
  ctx.lineWidth   = 4;
  ctx.strokeRect(24, 24, WIDTH - 48, HEIGHT - 48);

  // ── Header ────────────────────────────────────────────────────────────────
  // Tree center — title and subtitle align to the tree, not the full canvas
  const treeCenterX = TREE_OFFSET_X + TREE_W / 2;

  // Accent line above title
  ctx.fillStyle = "#a8d8dc";
  ctx.fillRect(treeCenterX - 420, 48, 840, 4);

  ctx.fillStyle = "#c4e4e8";
  ctx.font      = "bold 110px 'Times New Roman'";
  ctx.textAlign = "center";
  ctx.fillText("RAV ROSTER", treeCenterX, 148);

  const now     = new Date();
  const dateStr = now.toLocaleDateString("en-GB");
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  ctx.fillStyle = "#607a7e";
  ctx.font      = "42px 'Times New Roman'";
  ctx.fillText(`${totalMembers} active members  ·  ${dateStr} at ${timeStr}`, treeCenterX, 208);

  // Divider
  ctx.strokeStyle = "rgba(162,198,202,0.20)";
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(70, 238);
  ctx.lineTo(WIDTH - 70, 238);
  ctx.stroke();

  // Logo
  try {
    const logo = await loadImage("./assets/rav_logo.png");
    ctx.globalAlpha = 0.88;
    ctx.drawImage(logo, WIDTH - 480, 20, 440, 440);
    ctx.globalAlpha = 1;
  } catch (e) {
    console.error("Logo not found:", e);
  }

  // ── Honorary panel ────────────────────────────────────────────────────────
  const HON_BOX_W   = 500;
  const HON_BOX_H   = 210;
  const HON_PAN_X   = 34;
  const HON_GAP     = 20;
  const HON_START_Y = HEADER_H + 70;

  if (honoraryMembers.length > 0) {
    ctx.fillStyle = "#c084fc";
    ctx.font      = "bold 52px 'Times New Roman'";
    ctx.textAlign = "center";
    ctx.fillText("HONORARY", HON_PAN_X + HON_PANEL_W / 2, HON_START_Y - 22);

    ctx.strokeStyle = "rgba(192,100,255,0.45)";
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(HON_PAN_X + 30, HON_START_Y - 6);
    ctx.lineTo(HON_PAN_X + HON_PANEL_W - 30, HON_START_Y - 6);
    ctx.stroke();

    honoraryMembers.forEach((member, idx) => {
      const bx = HON_PAN_X + (HON_PANEL_W - HON_BOX_W) / 2;
      const by = HON_START_Y + 18 + idx * (HON_BOX_H + HON_GAP);

      // Body gradient
      const bodyG = ctx.createLinearGradient(bx, by, bx, by + HON_BOX_H);
      bodyG.addColorStop(0, "#28104a");
      bodyG.addColorStop(1, "#160830");
      rRect(ctx, bx, by, HON_BOX_W, HON_BOX_H, CORNER_R);
      ctx.fillStyle = bodyG;
      ctx.fill();

      // Border
      rRect(ctx, bx, by, HON_BOX_W, HON_BOX_H, CORNER_R);
      ctx.strokeStyle = "rgba(192,100,255,0.55)";
      ctx.lineWidth   = 2;
      ctx.stroke();

      // Strip
      const stripG = ctx.createLinearGradient(bx, by, bx, by + 74);
      stripG.addColorStop(0, "#3c0870");
      stripG.addColorStop(1, "#2a0550");
      rRectTop(ctx, bx, by, HON_BOX_W, 74, CORNER_R);
      ctx.fillStyle = stripG;
      ctx.fill();

      // Accent top bar
      rRectTop(ctx, bx, by, HON_BOX_W, 5, CORNER_R);
      ctx.fillStyle = "#c084fc";
      ctx.fill();

      // Strip separator
      ctx.strokeStyle = "rgba(192,100,255,0.25)";
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(bx + 12, by + 74);
      ctx.lineTo(bx + HON_BOX_W - 12, by + 74);
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillStyle = "#e4b8ff";
      ctx.font      = "bold 34px 'Times New Roman'";
      ctx.fillText("HONORARY", bx + HON_BOX_W / 2, by + 52);

      ctx.fillStyle = "#f0e0ff";
      ctx.font      = "bold 48px 'Times New Roman'";
      const honName = member.name.length > 17 ? member.name.substring(0, 15) + "…" : member.name;
      ctx.fillText(honName, bx + HON_BOX_W / 2, by + 136);

      ctx.fillStyle = "#9060c0";
      ctx.font      = "italic 32px 'Times New Roman'";
      const honUser = `@${member.username}`;
      ctx.fillText(honUser.length > 20 ? honUser.substring(0, 18) + "…" : honUser,
        bx + HON_BOX_W / 2, by + 184);
    });
  }

  // ── Main org chart ────────────────────────────────────────────────────────
  let currentY    = HEADER_H + 30;
  let prevBottomY = 0;
  let prevCenterX = 0;

  ranksPresent.forEach((rank, rankIndex) => {
    const members = rosterData[rank];
    if (!members?.length) return;

    const memberCount = members.length;
    const rows        = Math.ceil(memberCount / MAX_PER_ROW);
    const blockH      = rankBlockH(memberCount);
    const style       = SUBGROUP_STYLE[getRankSubGroup(rank)];

    // ── Sub-group banner (pill, no shadow) ───────────────────────────────
    const groupLabel = getSubGroupLabel(rank);
    if (groupLabel) {
      const label  = groupLabel.toUpperCase();
      ctx.font     = "bold 90px 'Times New Roman'";
      const textW  = ctx.measureText(label).width;
      const padX   = 90;
      const pillW  = textW + padX * 2;
      const pillH  = BANNER_H - 26;
      const pillX  = treeCenterX - pillW / 2;
      const pillY  = currentY - 10;

      // Pill fill — subtle gradient
      const pillFill = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY);
      pillFill.addColorStop(0,   "rgba(20,24,36,0.95)");
      pillFill.addColorStop(0.5, "rgba(28,32,50,0.90)");
      pillFill.addColorStop(1,   "rgba(20,24,36,0.95)");
      rRect(ctx, pillX, pillY, pillW, pillH, 14);
      ctx.fillStyle = pillFill;
      ctx.fill();

      // Pill border (accent color, no glow)
      rRect(ctx, pillX, pillY, pillW, pillH, 14);
      ctx.strokeStyle = style.border;
      ctx.lineWidth   = 3;
      ctx.stroke();

      // Left accent bar
      ctx.fillStyle = style.accent;
      ctx.fillRect(pillX,              pillY + 14, 10, pillH - 28);

      // Right accent bar
      ctx.fillRect(pillX + pillW - 10, pillY + 14, 10, pillH - 28);

      // Label
      ctx.fillStyle = style.text;
      ctx.font      = "bold 90px 'Times New Roman'";
      ctx.textAlign = "center";
      ctx.fillText(label, treeCenterX, pillY + pillH - 18);

      currentY += BANNER_H;
    }

    // ── Connecting lines ─────────────────────────────────────────────────
    if (rankIndex > 0 && !isFirstInGroup(rank) && prevBottomY > 0) {
      const fCount  = Math.min(memberCount, MAX_PER_ROW);
      const fWidth  = fCount * BOX_W + (fCount - 1) * BOX_GAP;
      const fStartX = TREE_OFFSET_X + (TREE_W - fWidth) / 2;

      ctx.strokeStyle = "#5a9ca8";
      ctx.lineWidth   = 6;
      ctx.lineCap     = "round";

      ctx.beginPath();
      ctx.moveTo(prevCenterX, prevBottomY);
      ctx.lineTo(prevCenterX, currentY - 16);
      ctx.stroke();

      if (memberCount > 1) {
        ctx.beginPath();
        ctx.moveTo(fStartX + BOX_W / 2, currentY - 20);
        ctx.lineTo(fStartX + fWidth - BOX_W / 2, currentY - 20);
        ctx.stroke();
      }

      for (let i = 0; i < fCount; i++) {
        const lx = fStartX + i * (BOX_W + BOX_GAP) + BOX_W / 2;
        ctx.beginPath();
        ctx.moveTo(lx, currentY - 20);
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

        // Box body gradient
        const bodyG = ctx.createLinearGradient(x, y, x, y + BOX_H);
        bodyG.addColorStop(0, "#1c2e3a");
        bodyG.addColorStop(1, "#111e28");
        rRect(ctx, x, y, BOX_W, BOX_H, CORNER_R);
        ctx.fillStyle = bodyG;
        ctx.fill();

        // Border
        rRect(ctx, x, y, BOX_W, BOX_H, CORNER_R);
        ctx.strokeStyle = style.border;
        ctx.lineWidth   = 2;
        ctx.stroke();

        // Top strip gradient
        const stripG = ctx.createLinearGradient(x, y, x, y + STRIP_H);
        stripG.addColorStop(0, style.stripA);
        stripG.addColorStop(1, style.stripB);
        rRectTop(ctx, x, y, BOX_W, STRIP_H, CORNER_R);
        ctx.fillStyle = stripG;
        ctx.fill();

        // 5px accent bar at very top
        rRectTop(ctx, x, y, BOX_W, 5, CORNER_R);
        ctx.fillStyle = style.accent;
        ctx.fill();

        // Strip / body separator
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(x + 10, y + STRIP_H);
        ctx.lineTo(x + BOX_W - 10, y + STRIP_H);
        ctx.stroke();

        // ── Level + count badges (left of first box per rank) ────────────
        if (globalIdx === 0) {
          ctx.font = "bold 36px 'Times New Roman'";
          const lvlText = `LVL ${RANK_LEVELS[rank] ?? "?"}`;
          const cntText = `× ${memberCount}`;
          const pillW   = Math.max(ctx.measureText(lvlText).width,
                                   ctx.measureText(cntText).width) + 32;
          const pillH   = 46;
          const pillGap = 10;
          const pillX   = x - pillW - 16;
          const lvlY    = y + BOX_H / 2 - pillH - pillGap / 2;
          const cntY    = y + BOX_H / 2 + pillGap / 2;

          // LVL pill
          rRect(ctx, pillX, lvlY, pillW, pillH, 10);
          ctx.fillStyle = "#0a0e1a";
          ctx.fill();
          rRect(ctx, pillX, lvlY, pillW, pillH, 10);
          ctx.strokeStyle = style.border;
          ctx.lineWidth   = 2;
          ctx.stroke();

          // Count pill
          rRect(ctx, pillX, cntY, pillW, pillH, 10);
          ctx.fillStyle = "#0a0e1a";
          ctx.fill();
          rRect(ctx, pillX, cntY, pillW, pillH, 10);
          ctx.strokeStyle = style.border;
          ctx.lineWidth   = 2;
          ctx.stroke();

          ctx.fillStyle = style.text;
          ctx.font      = "bold 36px 'Times New Roman'";
          ctx.textAlign = "center";
          ctx.fillText(lvlText, pillX + pillW / 2, lvlY + pillH - 11);
          ctx.fillText(cntText, pillX + pillW / 2, cntY  + pillH - 11);
        }

        // ── Rank title ───────────────────────────────────────────────────
        ctx.fillStyle = style.text;
        ctx.font      = "bold 50px 'Times New Roman'";
        ctx.textAlign = "center";
        const rankLabel = rank.length > 22 ? rank.substring(0, 20) + "…" : rank;
        ctx.fillText(rankLabel.toUpperCase(), x + BOX_W / 2, y + STRIP_H - 18);

        // ── Member name ──────────────────────────────────────────────────
        ctx.fillStyle = "#d4eaf0";
        ctx.font      = "bold 50px 'Times New Roman'";
        const nameText = member.name.length > 18 ? member.name.substring(0, 16) + "…" : member.name;
        ctx.fillText(nameText, x + BOX_W / 2, y + STRIP_H + 78);

        // ── Username ─────────────────────────────────────────────────────
        ctx.fillStyle = "#4a8898";
        ctx.font      = "italic 34px 'Times New Roman'";
        const uText = `@${member.username}`;
        ctx.fillText(uText.length > 22 ? uText.substring(0, 20) + "…" : uText,
          x + BOX_W / 2, y + STRIP_H + 128);
      });
    }

    // Track bottom center of this rank for next connecting line
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
  ctx.moveTo(100, HEIGHT - FOOTER_H + 10);
  ctx.lineTo(WIDTH - 100, HEIGHT - FOOTER_H + 10);
  ctx.stroke();

  ctx.fillStyle = "#4a6468";
  ctx.font      = "32px 'Times New Roman'";
  ctx.textAlign = "center";
  ctx.fillText(`Generated by RAV Roster Bot  ·  ${dateStr} at ${timeStr}`, WIDTH / 2, HEIGHT - 44);

  return canvas.toBuffer();
}
