import { createCanvas } from "canvas";

const RANK_ORDER = [
  "Vanguard Supreme",
  "Phantom Leader",
  "Phantom Regent",
  "Night Council",
  "Black Sigil",
  "Honorary",
  "Spectre",
  "Revenant",
  "Vantage",
  "Dagger",
  "Neophyte"
];

export async function generateRosterCanvas(rosterData) {
  const width = 10000;
  
  // Calculate total members
  const totalMembers = Object.values(rosterData).reduce((sum, members) => sum + members.length, 0);
  
  // Filter ranks that have members
  const ranksPresent = RANK_ORDER.filter(rank => rosterData[rank]?.length > 0);
  
  // Calculate height based on number of ranks
  const rankHeight = 400;
  const headerHeight = 350;
  const footerHeight = 150;
  const height = headerHeight + (ranksPresent.length * rankHeight) + footerHeight;
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // ===== BACKGROUND (Dark Gradient) =====
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

  // Subtitle
  ctx.font = "52px 'Times New Roman'";
  ctx.fillStyle = "#ccc";
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB");
  const timeStr = now.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' });
  ctx.fillText(`Active members: ${totalMembers} | Updated: ${dateStr} ${timeStr}`, width / 2, 230);

  // Divider line
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(100, 290);
  ctx.lineTo(width - 100, 290);
  ctx.stroke();

  // ===== ORG CHART =====
  let currentY = headerHeight + 50;

  ranksPresent.forEach((rank, rankIndex) => {
    const members = rosterData[rank];
    if (!members || members.length === 0) return;

    const memberCount = members.length;
    const boxWidth = 500;
    const boxHeight = 220;
    const gap = 40;
    
    // Calculate total width needed for this rank
    const totalWidth = (memberCount * boxWidth) + ((memberCount - 1) * gap);
    const startX = (width - totalWidth) / 2;

    // Draw connecting lines to previous rank
    if (rankIndex > 0) {
      const prevRank = ranksPresent[rankIndex - 1];
      const prevMembers = rosterData[prevRank];
      const prevCount = prevMembers.length;
      const prevBoxWidth = 500;
      const prevGap = 40;
      const prevTotalWidth = (prevCount * prevBoxWidth) + ((prevCount - 1) * prevGap);
      const prevStartX = (width - prevTotalWidth) / 2;

      ctx.strokeStyle = "#a2C6Ca"; // Cyan lines
      ctx.lineWidth = 8; // THICK

      const prevCenterY = currentY - rankHeight + boxHeight;
      const currentCenterY = currentY;
      const prevCenterX = prevStartX + prevTotalWidth / 2;

      ctx.beginPath();
      ctx.moveTo(prevCenterX, prevCenterY);
      ctx.lineTo(prevCenterX, currentCenterY - 15);
      ctx.stroke();

      if (memberCount > 1) {
        ctx.beginPath();
        ctx.moveTo(startX + boxWidth / 2, currentCenterY - 20);
        ctx.lineTo(startX + totalWidth - boxWidth / 2, currentCenterY - 20);
        ctx.stroke();
      }

      members.forEach((member, index) => {
        const x = startX + (index * (boxWidth + gap)) + boxWidth / 2;
        ctx.beginPath();
        ctx.moveTo(x, currentCenterY - 20);
        ctx.lineTo(x, currentCenterY);
        ctx.stroke();
      });
    }

    // Draw member boxes
    members.forEach((member, index) => {
      const x = startX + (index * (boxWidth + gap));
      const y = currentY;

      // Box shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(x + 6, y + 6, boxWidth, boxHeight);

      // Box background - ALL CYAN (#A2C6CA)
      ctx.fillStyle = "#A2C6CA";
      ctx.fillRect(x, y, boxWidth, boxHeight);

      // Box border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, boxWidth, boxHeight);

        // ✅ Level indicator - ONLY on leftmost box (OUTSIDE on the left)

        if (index === 0) {
        const levelNumber = 10 - RANK_ORDER.indexOf(rank); // ✅ REVERSED
        ctx.fillStyle = "#a2C6Ca";
        ctx.font = "bold 50px 'Times New Roman'";
        ctx.textAlign = "right";
        ctx.fillText(`LVL ${levelNumber}`, x - 30, y + boxHeight / 2 + 15);
        }

        // Rank badge (darker cyan section)
        ctx.fillStyle = "#7da5a8";
        ctx.fillRect(x, y, boxWidth, 70);

      // Rank badge border
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
      const rankText = rank.length > 24 ? rank.substring(0, 22) + "..." : rank;
      ctx.fillText(rankText.toUpperCase(), x + boxWidth / 2, y + 48);

      // Member name
      ctx.fillStyle = "#000000";
      ctx.font = "bold 58px 'Times New Roman'";
      const nameText = member.name.length > 20 ? member.name.substring(0, 18) + "..." : member.name;
      ctx.fillText(nameText, x + boxWidth / 2, y + 135);

      // Username
      ctx.font = "42px 'Times New Roman'";
      ctx.fillStyle = "#1e1f24";
      const usernameText = `@${member.username}`;
      const displayUsername = usernameText.length > 24 ? usernameText.substring(0, 22) + "..." : usernameText;
      ctx.fillText(displayUsername, x + boxWidth / 2, y + 190);
    });

    currentY += rankHeight;
  });

  // ===== FOOTER =====
  ctx.fillStyle = "#888";
  ctx.font = "38px 'Times New Roman'";
  ctx.textAlign = "center";
  ctx.fillText("Generated by RAV Roster Bot", width / 2, height - 80);
  const currentDate = new Date().toLocaleDateString();
  ctx.fillText(`Generated on ${currentDate}`, width / 2, height - 35);

  return canvas.toBuffer();
}
