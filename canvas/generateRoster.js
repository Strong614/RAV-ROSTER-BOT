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

// Hardcoded levels — LVL 5 is intentionally skipped
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

// Honorary is handled separately (purple, left panel)
const HONORARY_RANK = "Honorary";

// Sub-group labels shown as dividers in the main tree
const SUB_GROUPS = {
  "Head Office":     ["Vanguard Supreme", "Phantom Leader", "Phantom Regent"],
  "Management Team": ["Night Council", "Black Sigil"],
  "RAV Members":     ["Spectre", "Revenant", "Vantage", "Dagger", "Neophyte"]
};

// Returns the sub-group label if this rank is the FIRST rank of a group
function getSubGroupLabel(rank) {
  for (const [label, ranks] of Object.entries(SUB_GROUPS)) {
    if (ranks[0] === rank) return label;
  }
  return null;
}

// Returns true if this rank starts a new sub-group (i.e. a banner sits above it)
function isFirstInGroup(rank) {
  return getSubGroupLabel(rank) !== null;
}

export async function generateRosterCanvas(rosterData) {
  const width = 10000;

  const totalMembers = Object.values(rosterData).reduce((sum, members) => sum + members.length, 0);

  const ranksPresent    = RANK_ORDER.filter(rank => rosterData[rank]?.length > 0);
  const honoraryMembers = rosterData[HONORARY_RANK] || [];

  const rankHeight          = 400;
  const headerHeight        = 350;
  const footerHeight        = 150;
  const subGroupLabelHeight = 160; // Tall enough for 110px font

  // Count how many sub-group banners will appear
  let bannerCount = 0;
  ranksPresent.forEach(rank => { if (getSubGroupLabel(rank)) bannerCount++; });

  const height = headerHeight + (ranksPresent.length * rankHeight) + (bannerCount * subGroupLabelHeight) + footerHeight;

  const canvas = createCanvas(width, height);
  const ctx    = canvas.getContext("2d");

  // ===== BACKGROUND =====
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#1e1f24");
  bg.addColorStop(1, "#14151a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // ===== OUTER BORDER =====
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 5;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  // ===== HEADER =====
  ctx.fillStyle = "#a2C6Ca";
  ctx.font = "bold 120px 'Times New Roman'";
  ctx.textAlign = "center";
  ctx.fillText("RAV ROSTER", width / 2, 160);

  ctx.font = "52px 'Times New Roman'";
  ctx.fillStyle = "#ccc";
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB");
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  ctx.fillText(`Active members: ${totalMembers} | Updated: ${dateStr} ${timeStr}`, width / 2, 230);

  // ===== LOGO =====
  try {
    const logo = await loadImage("./assets/rav_logo.png");
    const logoSize = 500;
    ctx.drawImage(logo, width - logoSize - 100, 400, logoSize, logoSize);
  } catch (err) {
    console.error("Logo not found:", err);
  }

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(100, 290);
  ctx.lineTo(width - 100, 290);
  ctx.stroke();

  // ===================================================
  // ===== LEFT PANEL — HONORARY (Purple) =====
  // ===================================================
  const honoraryPanelX  = 60;
  const honoraryPanelW  = 700;
  const honoraryBoxW    = 580;
  const honoraryBoxH    = 220;
  const honoraryGap     = 30;
  const honoraryStartY  = headerHeight + 60;

  if (honoraryMembers.length > 0) {
    // Panel title
    ctx.fillStyle = "#c084fc";
    ctx.font = "bold 56px 'Times New Roman'";
    ctx.textAlign = "center";
    ctx.fillText("HONORARY", honoraryPanelX + honoraryPanelW / 2, honoraryStartY - 20);

    // Underline
    ctx.strokeStyle = "#c084fc";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(honoraryPanelX + 30, honoraryStartY - 5);
    ctx.lineTo(honoraryPanelX + honoraryPanelW - 30, honoraryStartY - 5);
    ctx.stroke();

    honoraryMembers.forEach((member, index) => {
      const bx = honoraryPanelX + (honoraryPanelW - honoraryBoxW) / 2;
      const by = honoraryStartY + 20 + index * (honoraryBoxH + honoraryGap);

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(bx + 6, by + 6, honoraryBoxW, honoraryBoxH);

      // Box body — purple
      ctx.fillStyle = "#7e22ce";
      ctx.fillRect(bx, by, honoraryBoxW, honoraryBoxH);

      // Border
      ctx.strokeStyle = "#e9d5ff";
      ctx.lineWidth = 4;
      ctx.strokeRect(bx, by, honoraryBoxW, honoraryBoxH);

      // Header strip
      ctx.fillStyle = "#581c87";
      ctx.fillRect(bx, by, honoraryBoxW, 70);

      ctx.strokeStyle = "#e9d5ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, by + 70);
      ctx.lineTo(bx + honoraryBoxW, by + 70);
      ctx.stroke();

      // Rank label
      ctx.fillStyle = "#e9d5ff";
      ctx.font = "bold 36px 'Times New Roman'";
      ctx.textAlign = "center";
      ctx.fillText("HONORARY", bx + honoraryBoxW / 2, by + 48);

      // Member name
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 54px 'Times New Roman'";
      const nameText = member.name.length > 18 ? member.name.substring(0, 16) + "…" : member.name;
      ctx.fillText(nameText, bx + honoraryBoxW / 2, by + 135);

      // Username
      ctx.font = "38px 'Times New Roman'";
      ctx.fillStyle = "#d8b4fe";
      const usernameText = `@${member.username}`;
      const displayUsername = usernameText.length > 22 ? usernameText.substring(0, 20) + "…" : usernameText;
      ctx.fillText(displayUsername, bx + honoraryBoxW / 2, by + 190);
    });
  }

  // ===================================================
  // ===== MAIN ORG CHART =====
  // ===================================================
  const treeOffsetX = honoraryPanelW + 120;
  const treeWidth   = width - treeOffsetX - 80;

  let currentY = headerHeight + 50;

  ranksPresent.forEach((rank, rankIndex) => {
    const members = rosterData[rank];
    if (!members || members.length === 0) return;

    const memberCount   = members.length;
    const boxWidth      = 500;
    const boxHeight     = 220;
    const gap           = 40;
    const totalRowWidth = (memberCount * boxWidth) + ((memberCount - 1) * gap);
    const startX        = treeOffsetX + (treeWidth - totalRowWidth) / 2;

    // ---- Sub-group banner ----
    const groupLabel = getSubGroupLabel(rank);
    if (groupLabel) {
      const bannerX = treeOffsetX;
      const bannerY = currentY;
      const bannerH = subGroupLabelHeight;

      // Measure text width first so we can size the pill around it
      ctx.font = "bold 110px 'Times New Roman'";
      const labelText   = groupLabel.toUpperCase();
      const textMetrics = ctx.measureText(labelText);
      const padX        = 100;
      const pillW       = textMetrics.width + padX * 2;
      const pillH       = subGroupLabelHeight - 20;
      const treeCenterX = treeOffsetX + treeWidth / 2;
      const pillX       = treeCenterX - pillW / 2; // truly centered
      const pillY       = bannerY + 10;

      // Compact background pill
      const bannerGrad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY);
      bannerGrad.addColorStop(0, "rgba(162, 198, 202, 0.30)");
      bannerGrad.addColorStop(0.5, "rgba(162, 198, 202, 0.18)");
      bannerGrad.addColorStop(1, "rgba(162, 198, 202, 0.30)");
      ctx.fillStyle = bannerGrad;
      ctx.fillRect(pillX, pillY, pillW, pillH);

      // Left accent bar
      ctx.fillStyle = "#a2C6Ca";
      ctx.fillRect(pillX, pillY, 14, pillH);

      // Right accent bar
      ctx.fillRect(pillX + pillW - 14, pillY, 14, pillH);

      // Border
      ctx.strokeStyle = "rgba(162, 198, 202, 0.6)";
      ctx.lineWidth = 4;
      ctx.strokeRect(pillX, pillY, pillW, pillH);

      // Centered label text
      ctx.fillStyle = "#a2C6Ca";
      ctx.font = "bold 110px 'Times New Roman'";
      ctx.textAlign = "center";
      ctx.fillText(labelText, treeCenterX, pillY + pillH - 22);

      currentY += bannerH;
    }

    // ---- Connecting lines to previous rank ----
    // Skip arrows entirely when this rank opens a new sub-group section
    const skipArrow = isFirstInGroup(rank);

    if (rankIndex > 0 && !skipArrow) {
      let prevRankIndex = rankIndex - 1;
      while (
        prevRankIndex >= 0 &&
        (!rosterData[ranksPresent[prevRankIndex]] || rosterData[ranksPresent[prevRankIndex]].length === 0)
      ) {
        prevRankIndex--;
      }

      if (prevRankIndex >= 0) {
        const prevRank    = ranksPresent[prevRankIndex];
        const prevMembers = rosterData[prevRank];
        const prevCount   = prevMembers.length;
        const prevTotal   = (prevCount * boxWidth) + ((prevCount - 1) * gap);
        const prevStartX  = treeOffsetX + (treeWidth - prevTotal) / 2;

        ctx.strokeStyle = "#a2C6Ca";
        ctx.lineWidth   = 8;

        const prevCenterY    = currentY - rankHeight + boxHeight;
        const currentCenterY = currentY;
        const prevCenterX    = prevStartX + prevTotal / 2;

        ctx.beginPath();
        ctx.moveTo(prevCenterX, prevCenterY);
        ctx.lineTo(prevCenterX, currentCenterY - 15);
        ctx.stroke();

        if (memberCount > 1) {
          ctx.beginPath();
          ctx.moveTo(startX + boxWidth / 2, currentCenterY - 20);
          ctx.lineTo(startX + totalRowWidth - boxWidth / 2, currentCenterY - 20);
          ctx.stroke();
        }

        members.forEach((_, i) => {
          const x = startX + (i * (boxWidth + gap)) + boxWidth / 2;
          ctx.beginPath();
          ctx.moveTo(x, currentCenterY - 20);
          ctx.lineTo(x, currentCenterY);
          ctx.stroke();
        });
      }
    }

    // ---- Draw member boxes ----
    members.forEach((member, index) => {
      const x = startX + (index * (boxWidth + gap));
      const y = currentY;

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(x + 6, y + 6, boxWidth, boxHeight);

      // Box body
      ctx.fillStyle = "#A2C6CA";
      ctx.fillRect(x, y, boxWidth, boxHeight);

      // Border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, boxWidth, boxHeight);

      // Level indicator — uses hardcoded map (LVL 5 intentionally skipped)
      if (index === 0) {
        const levelNumber = RANK_LEVELS[rank] ?? "?";
        ctx.fillStyle = "#a2C6Ca";
        ctx.font = "bold 50px 'Times New Roman'";
        ctx.textAlign = "right";
        ctx.fillText(`LVL ${levelNumber}`, x - 30, y + boxHeight / 2 + 15);
      }

      // Rank badge strip
      ctx.fillStyle = "#7da5a8";
      ctx.fillRect(x, y, boxWidth, 70);

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y + 70);
      ctx.lineTo(x + boxWidth, y + 70);
      ctx.stroke();

      // Rank text
      ctx.fillStyle = "#000000";
      ctx.font = "bold 42px 'Times New Roman'";
      ctx.textAlign = "center";
      const rankText = rank.length > 24 ? rank.substring(0, 22) + "…" : rank;
      ctx.fillText(rankText.toUpperCase(), x + boxWidth / 2, y + 48);

      // Member name
      ctx.fillStyle = "#000000";
      ctx.font = "bold 58px 'Times New Roman'";
      const nameText = member.name.length > 20 ? member.name.substring(0, 18) + "…" : member.name;
      ctx.fillText(nameText, x + boxWidth / 2, y + 135);

      // Username
      ctx.font = "42px 'Times New Roman'";
      ctx.fillStyle = "#1e1f24";
      const usernameText = `@${member.username}`;
      const displayUsername = usernameText.length > 24 ? usernameText.substring(0, 22) + "…" : usernameText;
      ctx.fillText(displayUsername, x + boxWidth / 2, y + 190);
    });

    currentY += rankHeight;
  });

  // ===== FOOTER =====
  ctx.fillStyle = "#888";
  ctx.font = "38px 'Times New Roman'";
  ctx.textAlign = "center";
  ctx.fillText("Generated by RAV Roster Bot", width / 2, height - 80);
  ctx.fillText(`Generated on ${now.toLocaleDateString()}`, width / 2, height - 35);

  return canvas.toBuffer();
}
