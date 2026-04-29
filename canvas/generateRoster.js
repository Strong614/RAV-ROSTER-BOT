import { createCanvas, loadImage } from "canvas";

const RANK_ORDER = [
  "Vanguard Supreme",   // LVL 10
  "Phantom Leader",     // LVL 9
  "Phantom Regent",     // LVL 8
  "Night Council",      // LVL 7
  "Black Sigil",        // LVL 6
  "Spectre",            // LVL 4
  "Revenant",           // LVL 3
  "Vantage",            // LVL 2
  "Dagger",             // LVL 1
  "Neophyte"            // LVL 0
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

// Visual style per sub-group
const SUBGROUP_STYLE = {
  "Head Office": {
    stripFrom:   "#4a2c00",
    stripTo:     "#a87010",
    stripText:   "#ffeebb",
    accent:      "#c89828",
    border:      "rgba(200, 152, 40, 0.75)",
    glow:        "rgba(200, 152, 40, 0.35)",
  },
  "Management Team": {
    stripFrom:   "#062535",
    stripTo:     "#0e6080",
    stripText:   "#b0e8f8",
    accent:      "#20a8d0",
    border:      "rgba(32, 168, 208, 0.65)",
    glow:        "rgba(32, 168, 208, 0.30)",
  },
  "RAV Members": {
    stripFrom:   "#0d1a38",
    stripTo:     "#1e3e88",
    stripText:   "#b0c8ff",
    accent:      "#4070d8",
    border:      "rgba(64, 112, 216, 0.65)",
    glow:        "rgba(64, 112, 216, 0.30)",
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

// Rounded rectangle path helper — r can be a number (uniform) or {tl,tr,br,bl}
function rRect(ctx, x, y, w, h, r) {
  const tl = typeof r === "object" ? (r.tl ?? 0) : r;
  const tr = typeof r === "object" ? (r.tr ?? 0) : r;
  const br = typeof r === "object" ? (r.br ?? 0) : r;
  const bl = typeof r === "object" ? (r.bl ?? 0) : r;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.arcTo(x + w, y,     x + w, y + tr,     tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  ctx.lineTo(x + bl, y + h);
  ctx.arcTo(x,     y + h, x,     y + h - bl, bl);
  ctx.lineTo(x, y + tl);
  ctx.arcTo(x,     y,     x + tl, y,          tl);
  ctx.closePath();
}

export async function generateRosterCanvas(rosterData) {
  const width = 10000;

  const totalMembers = Object.values(rosterData).reduce((sum, m) => sum + m.length, 0);
  const ranksPresent    = RANK_ORDER.filter(rank => rosterData[rank]?.length > 0);
  const honoraryMembers = rosterData[HONORARY_RANK] || [];

  // ── Layout constants ──────────────────────────────────────────────────────
  const BOX_W           = 500;
  const BOX_H           = 230;
  const STRIP_H         = 78;   // rank badge strip inside each box
  const BOX_GAP         = 44;   // horizontal gap between boxes
  const ROW_GAP         = 36;   // vertical gap between wrapped rows of the same rank
  const CORNER_R        = 18;   // box corner radius

  const HONORARY_PANEL_W = 720;
  const TREE_OFFSET_X    = HONORARY_PANEL_W + 120;
  const TREE_W           = width - TREE_OFFSET_X - 80;

  const MAX_PER_ROW = Math.max(1, Math.floor((TREE_W + BOX_GAP) / (BOX_W + BOX_GAP)));

  function rankBlockH(n) {
    const rows = Math.ceil(n / MAX_PER_ROW);
    return rows * BOX_H + (rows - 1) * ROW_GAP + 90;
  }

  const HEADER_H         = 360;
  const FOOTER_H         = 160;
  const BANNER_H         = 168;

  // Height pre-pass
  let totalContentH = 0;
  ranksPresent.forEach(rank => {
    if (getSubGroupLabel(rank)) totalContentH += BANNER_H + 44;
    totalContentH += rankBlockH(rosterData[rank]?.length || 0);
  });
  const height = HEADER_H + totalContentH + FOOTER_H;

  const canvas = createCanvas(width, height);
  const ctx    = canvas.getContext("2d");

  // ── BACKGROUND ─────────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0,   "#141620");
  bg.addColorStop(0.5, "#0f1018");
  bg.addColorStop(1,   "#0a0b10");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Subtle diagonal texture — fine dots
  ctx.fillStyle = "rgba(255,255,255,0.012)";
  for (let ty = 0; ty < height; ty += 60) {
    for (let tx = 0; tx < width; tx += 60) {
      ctx.fillRect(tx, ty, 2, 2);
    }
  }

  // ── OUTER BORDER ───────────────────────────────────────────────────────────
  ctx.save();
  ctx.shadowColor = "rgba(162,198,202,0.25)";
  ctx.shadowBlur  = 30;
  rRect(ctx, 28, 28, width - 56, height - 56, 20);
  ctx.strokeStyle = "rgba(162,198,202,0.5)";
  ctx.lineWidth   = 4;
  ctx.stroke();
  ctx.restore();

  // ── HEADER ─────────────────────────────────────────────────────────────────
  // Corner accent lines flanking the title
  const titleY = 165;
  ctx.save();
  ctx.strokeStyle = "rgba(162,198,202,0.4)";
  ctx.lineWidth   = 3;
  const titleHalf = 560;
  ctx.beginPath(); ctx.moveTo(width / 2 - titleHalf - 80, titleY - 55);
  ctx.lineTo(width / 2 - titleHalf, titleY - 55); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(width / 2 + titleHalf, titleY - 55);
  ctx.lineTo(width / 2 + titleHalf + 80, titleY - 55); ctx.stroke();
  ctx.restore();

  // Title glow
  ctx.save();
  ctx.shadowColor = "rgba(162,198,202,0.7)";
  ctx.shadowBlur  = 40;
  ctx.fillStyle   = "#c8e8ec";
  ctx.font        = "bold 130px 'Times New Roman'";
  ctx.textAlign   = "center";
  ctx.fillText("RAV ROSTER", width / 2, titleY);
  ctx.restore();

  // Subtitle
  const now     = new Date();
  const dateStr = now.toLocaleDateString("en-GB");
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  ctx.fillStyle = "#8aa8ac";
  ctx.font      = "50px 'Times New Roman'";
  ctx.textAlign = "center";
  ctx.fillText(`${totalMembers} active members  ·  Updated ${dateStr} at ${timeStr}`, width / 2, 240);

  // Header divider — double line
  ctx.save();
  ctx.strokeStyle = "rgba(162,198,202,0.35)";
  ctx.lineWidth   = 3;
  ctx.beginPath(); ctx.moveTo(100, 292); ctx.lineTo(width - 100, 292); ctx.stroke();
  ctx.strokeStyle = "rgba(162,198,202,0.12)";
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(100, 298); ctx.lineTo(width - 100, 298); ctx.stroke();
  ctx.restore();

  // Logo
  try {
    const logo     = await loadImage("./assets/rav_logo.png");
    const logoSize = 480;
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.drawImage(logo, width - logoSize - 110, 360, logoSize, logoSize);
    ctx.restore();
  } catch (err) {
    console.error("Logo not found:", err);
  }

  // ── HONORARY PANEL ─────────────────────────────────────────────────────────
  const HON_PAN_X   = 60;
  const HON_BOX_W   = 590;
  const HON_BOX_H   = 230;
  const HON_GAP     = 32;
  const HON_START_Y = HEADER_H + 70;

  if (honoraryMembers.length > 0) {
    // Section label
    ctx.save();
    ctx.shadowColor = "rgba(192,132,252,0.6)";
    ctx.shadowBlur  = 24;
    ctx.fillStyle   = "#d8a8ff";
    ctx.font        = "bold 58px 'Times New Roman'";
    ctx.textAlign   = "center";
    ctx.fillText("HONORARY", HON_PAN_X + HONORARY_PANEL_W / 2, HON_START_Y - 24);
    ctx.restore();

    // Underline
    ctx.save();
    ctx.shadowColor = "rgba(192,132,252,0.5)";
    ctx.shadowBlur  = 14;
    ctx.strokeStyle = "#c084fc";
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.moveTo(HON_PAN_X + 40, HON_START_Y - 8);
    ctx.lineTo(HON_PAN_X + HONORARY_PANEL_W - 40, HON_START_Y - 8);
    ctx.stroke();
    ctx.restore();

    honoraryMembers.forEach((member, idx) => {
      const bx = HON_PAN_X + (HONORARY_PANEL_W - HON_BOX_W) / 2;
      const by = HON_START_Y + 24 + idx * (HON_BOX_H + HON_GAP);

      // Drop shadow
      ctx.save();
      ctx.shadowColor  = "rgba(0,0,0,0.8)";
      ctx.shadowBlur   = 22;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 6;
      rRect(ctx, bx, by, HON_BOX_W, HON_BOX_H, CORNER_R);
      ctx.fillStyle = "#000";
      ctx.fill();
      ctx.restore();

      // Box gradient — purple
      const honBodyGrad = ctx.createLinearGradient(bx, by, bx, by + HON_BOX_H);
      honBodyGrad.addColorStop(0, "#6d1aaa");
      honBodyGrad.addColorStop(1, "#3d0870");
      rRect(ctx, bx, by, HON_BOX_W, HON_BOX_H, CORNER_R);
      ctx.fillStyle = honBodyGrad;
      ctx.fill();

      // Glow border
      ctx.save();
      ctx.shadowColor = "rgba(192,100,255,0.55)";
      ctx.shadowBlur  = 18;
      rRect(ctx, bx, by, HON_BOX_W, HON_BOX_H, CORNER_R);
      ctx.strokeStyle = "rgba(210,140,255,0.8)";
      ctx.lineWidth   = 3;
      ctx.stroke();
      ctx.restore();

      // Strip gradient
      const honStripGrad = ctx.createLinearGradient(bx, by, bx, by + 75);
      honStripGrad.addColorStop(0, "#4a0880");
      honStripGrad.addColorStop(1, "#320560");
      rRect(ctx, bx, by, HON_BOX_W, 75, { tl: CORNER_R, tr: CORNER_R, br: 0, bl: 0 });
      ctx.fillStyle = honStripGrad;
      ctx.fill();

      // Strip separator
      ctx.strokeStyle = "rgba(210,140,255,0.4)";
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(bx + 12, by + 75);
      ctx.lineTo(bx + HON_BOX_W - 12, by + 75);
      ctx.stroke();

      // Rank label
      ctx.fillStyle = "#e4b8ff";
      ctx.font      = "bold 36px 'Times New Roman'";
      ctx.textAlign = "center";
      ctx.fillText("HONORARY", bx + HON_BOX_W / 2, by + 52);

      // Member name
      ctx.fillStyle = "#f5e8ff";
      ctx.font      = "bold 56px 'Times New Roman'";
      const honName = member.name.length > 18 ? member.name.substring(0, 16) + "…" : member.name;
      ctx.fillText(honName, bx + HON_BOX_W / 2, by + 142);

      // Username
      ctx.font      = "38px 'Times New Roman'";
      ctx.fillStyle = "#c084fc";
      const honUser = `@${member.username}`;
      const honUserDisplay = honUser.length > 22 ? honUser.substring(0, 20) + "…" : honUser;
      ctx.fillText(honUserDisplay, bx + HON_BOX_W / 2, by + 198);
    });
  }

  // ── MAIN ORG CHART ─────────────────────────────────────────────────────────
  let currentY      = HEADER_H + 50;
  let prevBottomY   = 0;
  let prevCenterX   = 0;

  ranksPresent.forEach((rank, rankIndex) => {
    const members     = rosterData[rank];
    if (!members || members.length === 0) return;

    const memberCount = members.length;
    const rows        = Math.ceil(memberCount / MAX_PER_ROW);
    const blockH      = rankBlockH(memberCount);
    const treeCenterX = TREE_OFFSET_X + TREE_W / 2;
    const subGroup    = getRankSubGroup(rank);
    const style       = SUBGROUP_STYLE[subGroup];

    // ── Sub-group banner ──────────────────────────────────────────────────
    const groupLabel = getSubGroupLabel(rank);
    if (groupLabel) {
      const bannerY = currentY - 64;

      ctx.font = "bold 110px 'Times New Roman'";
      const label       = groupLabel.toUpperCase();
      const textW       = ctx.measureText(label).width;
      const padX        = 110;
      const pillW       = textW + padX * 2;
      const pillH       = BANNER_H - 24;
      const pillX       = treeCenterX - pillW / 2;
      const pillY       = bannerY + 12;

      // Pill background
      const pillGrad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY);
      pillGrad.addColorStop(0,   `${style.glow.replace("0.30", "0.22")}`);
      pillGrad.addColorStop(0.5, `${style.glow.replace("0.30", "0.10")}`);
      pillGrad.addColorStop(1,   `${style.glow.replace("0.30", "0.22")}`);
      ctx.save();
      rRect(ctx, pillX, pillY, pillW, pillH, 16);
      ctx.fillStyle = pillGrad;
      ctx.fill();

      // Pill border with glow
      ctx.shadowColor = style.accent;
      ctx.shadowBlur  = 20;
      rRect(ctx, pillX, pillY, pillW, pillH, 16);
      ctx.strokeStyle = style.border;
      ctx.lineWidth   = 3;
      ctx.stroke();
      ctx.restore();

      // Left + right accent bars
      rRect(ctx, pillX, pillY, 12, pillH, { tl: 16, tr: 0, br: 0, bl: 16 });
      ctx.fillStyle = style.accent;
      ctx.fill();
      rRect(ctx, pillX + pillW - 12, pillY, 12, pillH, { tl: 0, tr: 16, br: 16, bl: 0 });
      ctx.fill();

      // Label text with glow
      ctx.save();
      ctx.shadowColor = style.accent;
      ctx.shadowBlur  = 28;
      ctx.fillStyle   = style.stripText;
      ctx.font        = "bold 110px 'Times New Roman'";
      ctx.textAlign   = "center";
      ctx.fillText(label, treeCenterX, pillY + pillH - 20);
      ctx.restore();

      currentY += BANNER_H + 44;
    }

    // ── Connecting lines ──────────────────────────────────────────────────
    const skipArrow = isFirstInGroup(rank);

    if (rankIndex > 0 && !skipArrow && prevBottomY > 0) {
      const firstRowCount  = Math.min(memberCount, MAX_PER_ROW);
      const firstRowWidth  = firstRowCount * BOX_W + (firstRowCount - 1) * BOX_GAP;
      const firstRowStartX = TREE_OFFSET_X + (TREE_W - firstRowWidth) / 2;

      ctx.save();
      ctx.strokeStyle = "#a2c6ca";
      ctx.lineWidth   = 7;
      ctx.lineCap     = "round";
      ctx.shadowColor = "rgba(162,198,202,0.55)";
      ctx.shadowBlur  = 18;

      // Vertical stem from previous rank
      ctx.beginPath();
      ctx.moveTo(prevCenterX, prevBottomY);
      ctx.lineTo(prevCenterX, currentY - 18);
      ctx.stroke();

      // Horizontal spread
      if (memberCount > 1) {
        ctx.beginPath();
        ctx.moveTo(firstRowStartX + BOX_W / 2, currentY - 22);
        ctx.lineTo(firstRowStartX + firstRowWidth - BOX_W / 2, currentY - 22);
        ctx.stroke();
      }

      // Short drops into each box top
      for (let i = 0; i < firstRowCount; i++) {
        const lx = firstRowStartX + i * (BOX_W + BOX_GAP) + BOX_W / 2;
        ctx.beginPath();
        ctx.moveTo(lx, currentY - 22);
        ctx.lineTo(lx, currentY - 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // ── Member boxes ─────────────────────────────────────────────────────
    for (let row = 0; row < rows; row++) {
      const rowMembers  = members.slice(row * MAX_PER_ROW, (row + 1) * MAX_PER_ROW);
      const rowCount    = rowMembers.length;
      const rowW        = rowCount * BOX_W + (rowCount - 1) * BOX_GAP;
      const rowStartX   = TREE_OFFSET_X + (TREE_W - rowW) / 2;
      const rowY        = currentY + row * (BOX_H + ROW_GAP);

      rowMembers.forEach((member, i) => {
        const globalIdx = row * MAX_PER_ROW + i;
        const x = rowStartX + i * (BOX_W + BOX_GAP);
        const y = rowY;

        // ---- Drop shadow ----
        ctx.save();
        ctx.shadowColor   = "rgba(0,0,0,0.75)";
        ctx.shadowBlur    = 24;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 7;
        rRect(ctx, x, y, BOX_W, BOX_H, CORNER_R);
        ctx.fillStyle = "#000";
        ctx.fill();
        ctx.restore();

        // ---- Box body gradient ----
        const bodyGrad = ctx.createLinearGradient(x, y, x, y + BOX_H);
        bodyGrad.addColorStop(0, "#cce8ec");
        bodyGrad.addColorStop(1, "#8abec6");
        rRect(ctx, x, y, BOX_W, BOX_H, CORNER_R);
        ctx.fillStyle = bodyGrad;
        ctx.fill();

        // ---- Glowing border per sub-group ----
        ctx.save();
        ctx.shadowColor = style.glow;
        ctx.shadowBlur  = 16;
        rRect(ctx, x, y, BOX_W, BOX_H, CORNER_R);
        ctx.strokeStyle = style.border;
        ctx.lineWidth   = 3;
        ctx.stroke();
        ctx.restore();

        // ---- Rank badge strip (top of box) ----
        const stripGrad = ctx.createLinearGradient(x, y, x, y + STRIP_H);
        stripGrad.addColorStop(0, style.stripFrom);
        stripGrad.addColorStop(1, style.stripTo);
        rRect(ctx, x, y, BOX_W, STRIP_H, { tl: CORNER_R, tr: CORNER_R, br: 0, bl: 0 });
        ctx.fillStyle = stripGrad;
        ctx.fill();

        // Strip separator line
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(x + 14, y + STRIP_H);
        ctx.lineTo(x + BOX_W - 14, y + STRIP_H);
        ctx.stroke();

        // ---- Level pill — only on the first box of each rank ----
        if (globalIdx === 0) {
          const lvl     = RANK_LEVELS[rank] ?? "?";
          const lvlText = `LVL ${lvl}`;
          ctx.font = "bold 42px 'Times New Roman'";
          const lvlW  = ctx.measureText(lvlText).width + 40;
          const lvlH  = 58;
          const lvlX  = x - lvlW - 18;
          const lvlY  = y + (BOX_H - lvlH) / 2;

          // Pill background
          ctx.save();
          ctx.shadowColor = style.glow;
          ctx.shadowBlur  = 14;
          rRect(ctx, lvlX, lvlY, lvlW, lvlH, 12);
          ctx.fillStyle = "rgba(10,14,24,0.88)";
          ctx.fill();
          rRect(ctx, lvlX, lvlY, lvlW, lvlH, 12);
          ctx.strokeStyle = style.border;
          ctx.lineWidth   = 2;
          ctx.stroke();
          ctx.restore();

          ctx.fillStyle = style.stripText;
          ctx.font      = "bold 42px 'Times New Roman'";
          ctx.textAlign = "center";
          ctx.fillText(lvlText, lvlX + lvlW / 2, lvlY + lvlH - 12);
        }

        // ---- Rank text in strip ----
        ctx.fillStyle = style.stripText;
        ctx.font      = "bold 40px 'Times New Roman'";
        ctx.textAlign = "center";
        const rankLabel = rank.length > 24 ? rank.substring(0, 22) + "…" : rank;
        // Show member count only in the first box of the rank
        const stripLabel = globalIdx === 0
          ? `${rankLabel.toUpperCase()}  •  ${memberCount}`
          : rankLabel.toUpperCase();
        ctx.fillText(stripLabel, x + BOX_W / 2, y + STRIP_H - 20);

        // ---- Member name ----
        ctx.fillStyle = "#0a1a1e";
        ctx.font      = "bold 58px 'Times New Roman'";
        const nameText = member.name.length > 20 ? member.name.substring(0, 18) + "…" : member.name;
        ctx.fillText(nameText, x + BOX_W / 2, y + STRIP_H + 82);

        // ---- Username ----
        ctx.font      = "italic 40px 'Times New Roman'";
        ctx.fillStyle = "#2a5a65";
        const uText = `@${member.username}`;
        const uDisplay = uText.length > 24 ? uText.substring(0, 22) + "…" : uText;
        ctx.fillText(uDisplay, x + BOX_W / 2, y + STRIP_H + 136);
      });
    }

    // Record bottom of this rank block for the next rank's connecting line
    const lastRow      = rows - 1;
    const lastRowCount = memberCount - lastRow * MAX_PER_ROW;
    const lastRowW     = lastRowCount * BOX_W + (lastRowCount - 1) * BOX_GAP;
    const lastRowStartX = TREE_OFFSET_X + (TREE_W - lastRowW) / 2;
    prevBottomY        = currentY + lastRow * (BOX_H + ROW_GAP) + BOX_H;
    prevCenterX        = lastRowStartX + lastRowW / 2;

    currentY += blockH;
  });

  // ── FOOTER ─────────────────────────────────────────────────────────────────
  // Separator
  ctx.save();
  ctx.strokeStyle = "rgba(162,198,202,0.2)";
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(150, height - FOOTER_H + 10);
  ctx.lineTo(width - 150, height - FOOTER_H + 10);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#556a6e";
  ctx.font      = "36px 'Times New Roman'";
  ctx.textAlign = "center";
  ctx.fillText("Generated by RAV Roster Bot", width / 2, height - 88);
  ctx.fillStyle = "#3a5055";
  ctx.font      = "32px 'Times New Roman'";
  ctx.fillText(`${dateStr} at ${timeStr}`, width / 2, height - 44);

  return canvas.toBuffer();
}
