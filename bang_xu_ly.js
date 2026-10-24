// Bảng theo dõi xử lý (trang Sự cố) - dùng chung cho giao diện máy tính / điện thoại (sửa được) và trang GitHub (chỉ xem).
// Cần sẵn: esc(), stUrl(), toast() (nếu sửa được). Gọi: boardHtml(B, {edit:true|false}).
const BX_BLOCKS = [["moi_ps","MỚI PHÁT SINH — ƯU TIÊN CAO NHẤT","#7d1f2a"],["moi","DẤU HIỆU MỚI CẦN XÁC MINH","#a83a3f"],["chua","CHƯA KHẮC PHỤC HOẶC CHƯA ĐỦ CĂN CỨ ĐÓNG VIỆC","#b4602a"],["phuc_hoi","ĐÃ PHỤC HỒI TRÊN APP – ĐANG THEO DÕI","#257a50"]];
const bxTime = s => !s ? "" : s.length <= 10 ? `${s.slice(8,10)}/${s.slice(5,7)}` : `${s.slice(11,16)} ${s.slice(8,10)}/${s.slice(5,7)}`;
const bxHan = h => h==="Giao ngay trong ngày" || h==="Ưu tiên trong ngày" ? "bx-h0" : h==="Trong ngày" ? "bx-h1" : h==="24–48 giờ" ? "bx-h2" : "bx-h3";
let BX = null, BX_EDIT = false;
const bxDelta = m => (m.them||m.bot) ? ` (${[m.them?'+'+m.them+' mới':'', m.bot?'−'+m.bot+' có lại':''].filter(Boolean).join(', ')})` : '';
const bxQuick = B => (B.dem_nhanh||[]).map(q=>`${q.hang} toàn tài khoản (đếm nhanh ${(q.luc||'').slice(11,16)}): ${q.chay} đang chạy | ${q.cho} chờ | ${q.ngoai_tuyen} ngoại tuyến${q.loi?` | ${q.loi} lỗi`:''} / ${q.tong} nhà máy - chỉ đếm, không theo dõi chi tiết`);
const bxRead = B => (B.luot_doc||[]).map(r=>`${r.hang} đọc ${r.doc===r.tong?'đủ ':''}${r.doc}/${r.tong} trạm${r.den?` lúc ${r.tu&&r.tu!==r.den?r.tu+'–':''}${r.den}`:''}${r.thieu.length?` (thiếu: ${r.thieu.slice(0,4).join(', ')}${r.thieu.length>4?' …':''})`:''}`);
function boardSummary(B){
  const t = B.tom_tat||{}, c = B.so_sanh||{};
  return `<div class="bx-sum"><b>${t.binh_thuong??0} bình thường</b><span>|</span><b>${t.loi??0} lỗi</b><span>|</span><b>${t.mat_ket_noi??0} ngoại tuyến</b>${t.chua_co_so_lieu?`<span>|</span><b>${t.chua_co_so_lieu} chưa có số liệu</b>`:''}<span class="bx-tot">= ${t.tram??0} trạm</span></div>
    <div class="bx-cmp">Inverter: <b>${t.inv_chay??0}</b> đang chạy · <b>${t.inv_cho??0}</b> đang chờ (0 kW) · <b>${t.inv_ngoai_tuyen??0}</b> ngoại tuyến (có SN) · <b>${t.canh_bao_nang??0}</b> bản ghi cảnh báo nặng hiện hoạt - không đồng nghĩa ${t.canh_bao_nang??0} thiết bị hỏng</div>
    ${(c.chi_so||[]).length?`<div class="bx-arrow">${c.chi_so.map(m=>`<span class="${m.nay>m.truoc||(m.nay===m.truoc&&m.them)?'up':m.nay<m.truoc?'down':''}">${esc(m.ten)}: ${m.truoc} → ${m.nay}${bxDelta(m)}</span>`).join('<i>|</i>')}</div>`:''}
    <div class="bx-cmp">${c.luc ? `So với lượt rà ${bxTime(c.luc)}: <span class="bx-c bx-cm">${c.moi} mới</span><span class="bx-c bx-cp">${c.phuc_hoi} đã phục hồi</span><span class="bx-c bx-ct">${c.tai_dien} tái diễn</span>` : 'Chưa có lượt rà trước để so sánh (phần mềm tự chốt 09:10 và 16:10 hằng ngày).'}</div>`;
}
function boardRow(x){
  const ref = esc(x.ref);
  const dev = `${x.key?`<a class="bx-st" href="${stUrl(x.key)}">${esc(x.station)}</a>`:`<b class="bx-st">${esc(x.station)}</b>`}${x.device?`<div>${esc(x.device)}</div>`:''}${x.serial&&x.serial!==x.device?`<div class="bx-sn">SN ${esc(x.serial)}</div>`:''}
    <div class="bx-tags"><span class="bx-t">${esc(x.title)}</span>${x.repeat?`<span class="bx-tag bx-rep">tái diễn${x.count>1?' ×'+x.count:''}</span>`:''}${x.loss_kw?`<span class="bx-tag bx-loss">mất ~${Math.round(x.loss_kw)} kW</span>`:''}</div>`;
  const viec = `<span class="bx-han ${bxHan(x.han)}">${esc(x.han.toUpperCase())}:</span> ${esc(x.viec)}${x.hoan_tat?`<div class="bx-done">✓ Hoàn tất khi: ${esc(x.hoan_tat)}</div>`:''}${x.nguoi?`<div class="bx-sn">👤 ${esc(x.nguoi)}</div>`:''}${x.sua?'<div class="bx-sn">(đã sửa)</div>':''}`;
  const kids = (x.children||[]).length ? `<details class="bx-kids"><summary>Xem từng trạm (${x.children.length})</summary>${x.children.map(c=>
      `<div><a class="bx-st" href="${stUrl(c.key)}">${esc(c.station)}</a> · ${esc(c.device)}${c.repeat?` <span class="bx-tag bx-rep">tái diễn ×${c.count}</span>`:''}<div class="bx-sn">${esc(c.evidence)}</div></div>`).join('')}</details>` : '';
  return `<tr data-ref="${ref}"><td>${dev}</td><td>${esc(x.evidence)}<div class="bx-sn">từ ${esc(bxTime(x.since))}</div>${kids}</td>
    <td class="bx-v">${viec}${BX_EDIT?`<button class="bx-ed" title="Sửa việc cần làm / hạn" onclick="bxEdit(this)">✎ Sửa</button>`:''}</td></tr>`;
}
function boardHtml(B, opt){
  BX = B; BX_EDIT = !!(opt&&opt.edit);
  if(!B || !B.blocks) return '<div class="empty">Chưa có bảng theo dõi xử lý</div>';
  const n = Object.values(B.blocks).reduce((a,l)=>a+l.length,0);
  return `<div class="bx" id="bx">
    <div class="bx-head"><div><h2>BẢNG THEO DÕI XỬ LÝ</h2><p>${B.so_sanh&&B.so_sanh.luc?`Đối chiếu lượt rà ${bxTime(B.so_sanh.luc)} và hiện tại ${bxTime(B.luc)}`:`Cập nhật ${bxTime(B.luc)}`}</p>
      <small>${(B.tom_tat||{}).tram||0} trạm · ${n} việc đang theo dõi</small>
      ${(B.luot_doc||[]).length?`<div class="bx-read">${bxRead(B).map(t=>`<span class="${/thiếu/.test(t)?'miss':''}">${esc(t)}</span>`).join('')}</div>`:''}
      ${(B.dem_nhanh||[]).length?`<div class="bx-read">${bxQuick(B).map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}</div>
      <div class="bx-act">${opt&&opt.actions||''}<button class="btn" onclick="boardPng()">📷 Xuất ảnh</button></div></div>
    ${boardSummary(B)}
    ${BX_BLOCKS.map(([k,t,c],i)=>{ const L = B.blocks[k]||[];
      return `<div class="bx-blk"><div class="bx-bh" style="background:${c}">${i+1} ${t} <span>(${L.length})</span></div>
        ${L.length?`<div class="tw"><table class="bx-tb"><thead><tr><th>Nhà máy / thiết bị</th><th>Bằng chứng và trạng thái</th><th>Việc cần làm tiếp</th></tr></thead><tbody>${L.map((x,j)=>k==="moi_ps"?boardRow(x).replace('<td>','<td><div class="bx-pri">ƯU TIÊN '+(j+1)+'</div>'):boardRow(x)).join('')}</tbody></table></div>`
          :'<div class="bx-none">Không có</div>'}</div>`; }).join('')}
    <div class="bx-notes">${(B.ghi_chu||[]).map(t=>`<div>• ${esc(t)}</div>`).join('')}</div></div>`;
}
function bxFind(ref){ for(const L of Object.values(BX.blocks)) for(const x of L) if(x.ref===ref) return x; return null; }
function bxEdit(btn){
  const tr = btn.closest("tr"), x = bxFind(tr.dataset.ref); if(!x) return;
  const td = tr.querySelector(".bx-v");
  td.innerHTML = `<select class="bx-in" id="bxHan">${(BX.han||[]).map(h=>`<option ${h===x.han?'selected':''}>${esc(h)}</option>`).join('')}</select>
    <textarea class="bx-in" id="bxViec" rows="3">${esc(x.viec)}</textarea>
    <textarea class="bx-in" id="bxDone" rows="2" placeholder="Hoàn tất khi…">${esc(x.hoan_tat||'')}</textarea>
    <input class="bx-in" id="bxNguoi" placeholder="Người phụ trách (không bắt buộc)" value="${esc(x.nguoi||'')}">
    <div style="display:flex;gap:6px;margin-top:6px"><button class="btn pri" onclick="bxSave(this)">Lưu</button><button class="btn" onclick="route()">Huỷ</button></div>`;
  td.querySelector("textarea").focus();
}
async function bxSave(btn){
  const tr = btn.closest("tr"), ref = tr.dataset.ref;
  const body = {ref, han: tr.querySelector("#bxHan").value, viec: tr.querySelector("#bxViec").value, nguoi: tr.querySelector("#bxNguoi").value,
    hoan_tat: tr.querySelector("#bxDone").value};
  btn.disabled = true;
  try{ const r = await post("/api/xuly_viec", body); if(!r.ok){ toast(r.msg||"Không lưu được"); btn.disabled=false; return; }
    const x = bxFind(ref); Object.assign(x, {han:body.han, viec:body.viec, nguoi:body.nguoi, hoan_tat:body.hoan_tat, sua:true});
    tr.outerHTML = boardRow(x); toast("Đã lưu việc cần làm tiếp"); }
  catch(e){ toast("Không lưu được"); btn.disabled=false; }
}
// ---- xuất ảnh PNG (vẽ bằng canvas, không gửi đi đâu - Kira tự gửi kỹ thuật)
function boardPng(){
  const B = BX; if(!B) return;
  const W = 2000, P = 50, cw = [520, 760, 620], F = '"Segoe UI", Arial, "Noto Sans", sans-serif';
  const cv = document.createElement("canvas"), g = cv.getContext("2d");
  const wrap = (txt, w, font) => { g.font = font; const out = []; String(txt||"").split("\n").forEach(par=>{ let line = "";
      par.split(" ").forEach(wd=>{ const t = line ? line+" "+wd : wd; if(g.measureText(t).width > w && line){ out.push(line); line = wd; } else line = t; }); out.push(line); }); return out; };
  // tính chiều cao trước
  const rowsOf = L => L.map(x=>{
    const c1 = [[x.station,"bold 28px "+F],[x.device||"","26px "+F],[(x.serial&&x.serial!==x.device)?"SN "+x.serial:"","22px "+F],[(x.title||"")+(x.repeat?"  [tái diễn"+(x.count>1?" ×"+x.count:"")+"]":""),"italic 24px "+F]]
      .filter(a=>a[0]).flatMap(([t,f])=>wrap(t,cw[0]-30,f).map(l=>[l,f]));
    const c2 = wrap(x.evidence, cw[1]-30, "26px "+F).map(l=>[l,"26px "+F]);
    const c3 = wrap(x.han.toUpperCase()+": "+x.viec, cw[2]-30, "26px "+F).map(l=>[l,"26px "+F])
      .concat(x.hoan_tat ? wrap("Hoàn tất khi: "+x.hoan_tat, cw[2]-30, "italic 24px "+F).map(l=>[l,"italic 24px "+F]) : []);
    return {x, c1, c2, c3, h: Math.max(c1.length, c2.length, c3.length)*36 + 30};
  });
  const blocks = BX_BLOCKS.map(([k,t,c])=>({t, c, rows: rowsOf((B.blocks[k]||[]).map((x,j)=>Object.assign({}, x,
      k==="moi_ps" ? {station: "ƯU TIÊN "+(j+1)+" · "+x.station} : {},
      x.children ? {evidence: x.evidence+"\n"+x.children.map(c=>"- "+c.station+": "+c.device).join("\n")} : {})))}));
  const arrows = (B.so_sanh&&B.so_sanh.chi_so||[]).map(m=>`${m.ten}: ${m.truoc} → ${m.nay}${bxDelta(m)}`).join("  |  ");
  const reads = wrap("Lượt đọc: " + bxRead(B).join(" • "), W-2*P, "24px "+F).concat(bxQuick(B).flatMap(t=>wrap(t, W-2*P, "24px "+F)));
  const notes = (B.ghi_chu||[]).flatMap(t=>wrap("• "+t, W-2*P, "24px "+F));
  let H = 250 + 110 + (arrows ? 46 : 0) + Math.max(0, reads.length-1)*30;
  blocks.forEach(b=>{ H += 70 + 56 + (b.rows.length ? b.rows.reduce((a,r)=>a+r.h,0) : 60) + 24; });
  H += notes.length*34 + 60;
  cv.width = W; cv.height = H;
  g.fillStyle = "#f3f5fa"; g.fillRect(0,0,W,H);
  g.fillStyle = "#1c3248"; g.fillRect(0,0,W,230+Math.max(0, reads.length-1)*30);
  g.fillStyle = "#fff"; g.font = "bold 58px "+F; g.fillText("HIỆP MINH THỊNH | BẢNG THEO DÕI XỬ LÝ", P, 95);
  g.font = "32px "+F; g.fillStyle = "#dfe7f2";
  g.fillText(B.so_sanh&&B.so_sanh.luc ? `Đối chiếu lượt rà ${bxTime(B.so_sanh.luc)} và hiện tại ${bxTime(B.luc)}` : `Cập nhật ${bxTime(B.luc)}`, P, 150);
  g.font = "24px "+F; reads.forEach((l,i)=>g.fillText(l, P, 192+i*30));
  const shift = Math.max(0, reads.length-1)*30;
  const t = B.tom_tat||{}, c = B.so_sanh||{};
  g.translate(0, shift);
  g.fillStyle = "#1c2733"; g.font = "bold 36px "+F;
  g.fillText(`${t.binh_thuong??0} bình thường | ${t.loi??0} lỗi | ${t.mat_ket_noi??0} ngoại tuyến${t.chua_co_so_lieu?` | ${t.chua_co_so_lieu} chưa có số liệu`:''}  (= ${t.tram??0} trạm)`, P, 290);
  g.font = "26px "+F; g.fillStyle = "#5b6878";
  g.fillText(`Inverter: ${t.inv_chay??0} đang chạy · ${t.inv_cho??0} đang chờ · ${t.inv_ngoai_tuyen??0} ngoại tuyến · ${t.canh_bao_nang??0} bản ghi cảnh báo nặng (không đồng nghĩa ${t.canh_bao_nang??0} thiết bị hỏng)`, P, 332);
  if(c.luc) g.fillText(`So với lượt rà ${bxTime(c.luc)}: ${c.moi} mới · ${c.phuc_hoi} đã phục hồi · ${c.tai_dien} tái diễn`, P, 370);
  let y = 400;
  if(arrows){ g.font = "bold 30px "+F; g.fillStyle = "#a83a3f"; g.fillText(arrows, P, y); y += 46; }
  blocks.forEach((b,i)=>{
    g.fillStyle = b.c; g.fillRect(P, y, W-2*P, 64); g.fillStyle = "#fff"; g.font = "bold 32px "+F; g.fillText(`${i+1} ${b.t} (${b.rows.length})`, P+20, y+44); y += 64;
    g.fillStyle = "#dde5ee"; g.fillRect(P, y, W-2*P, 56); g.fillStyle = "#1c2733"; g.font = "bold 28px "+F;
    let x0 = P; ["Nhà máy / thiết bị","Bằng chứng và trạng thái","Việc cần làm tiếp"].forEach((h,j)=>{ g.fillText(h, x0+16, y+38); x0 += cw[j]; }); y += 56;
    if(!b.rows.length){ g.fillStyle = "#fff"; g.fillRect(P, y, W-2*P, 60); g.fillStyle = "#5b6878"; g.font = "26px "+F; g.fillText("Không có", P+16, y+40); y += 60; }
    b.rows.forEach((r,k)=>{
      g.fillStyle = k%2 ? "#eef2f7" : "#fff"; g.fillRect(P, y, W-2*P, r.h);
      g.strokeStyle = "#cfd8e3"; g.lineWidth = 2; g.strokeRect(P, y, W-2*P, r.h);
      let xx = P; [r.c1, r.c2, r.c3].forEach((col,j)=>{ if(j){ g.beginPath(); g.moveTo(xx,y); g.lineTo(xx,y+r.h); g.stroke(); }
        col.forEach(([l,f],m)=>{ g.font = f; g.fillStyle = (j===2&&m===0&&/^GIAO NGAY|^ƯU TIÊN|^TRONG NGÀY/.test(l)) ? "#a83a3f" : "#1c2733"; g.fillText(l, xx+16, y+42+m*36); }); xx += cw[j]; });
      y += r.h;
    });
    y += 24;
  });
  g.fillStyle = "#5b6878"; notes.forEach((l,i)=>{ g.font = "24px "+F; g.fillText(l, P, y+30+i*34); });
  cv.toBlob(b=>{ const a = document.createElement("a"); a.href = URL.createObjectURL(b);
    a.download = `Bang_theo_doi_xu_ly_${(B.luc||"").slice(0,16).replace(/[-:T]/g,"")}.png`; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 2000); }, "image/png");
}

// ------------------------------------------------ 10 VIỆC ƯU TIÊN (gộp mọi hãng) - trình bày như bảng Mai Quý Tiên
function priorityHtml(B){
  const L = (B&&B.uu_tien)||[];
  if(!L.length) return '<div class="empty">Chưa có việc ưu tiên</div>';
  return `<div class="bx">
    <div class="bx-head"><div><h2>10 VIỆC ƯU TIÊN CẢI THIỆN VẬN HÀNH</h2><p>Gộp mọi hãng · đề xuất lúc ${bxTime(B.luc)}</p>
      <small>Ưu tiên lỗi có bằng chứng trước, sau đó xác minh trạm sản lượng riêng thấp. Đây là danh sách giao việc, không phải xếp hạng hiệu suất; hạn là đề xuất.</small></div>
      <div class="bx-act"><button class="btn" onclick="priorityPng()">📷 Xuất ảnh</button></div></div>
    <div class="bx-blk"><div class="tw"><table class="bx-tb ut-tb"><thead><tr><th>Ưu tiên / hạn</th><th>Hãng / nhà máy / thiết bị</th><th>Bằng chứng đã có</th><th>Giao việc và tiêu chí hoàn tất</th></tr></thead><tbody>
    ${L.map(x=>`<tr class="${x.han==='Ngay'?'ut-ngay':x.han==='Trong ngày'?'ut-trong':''}"><td><b class="ut-n">${x.stt}</b><div class="bx-han ${x.han==='Ngay'||x.han==='Trong ngày'?'bx-h0':'bx-h2'}">${esc(x.han.toUpperCase())}</div></td>
      <td><div class="bx-sn">${esc(x.hang)}</div><a class="bx-st" href="${stUrl(x.key)}">${esc(x.station)}</a>${x.device?`<div>${esc(x.device)}</div>`:''}${x.serial?`<div class="bx-sn">SN ${esc(x.serial)}</div>`:''}<div class="bx-t">${esc(x.title)}</div></td>
      <td>${esc(x.evidence)}</td><td>${esc(x.de_xuat)}<div class="bx-done">✓ Hoàn tất khi: ${esc(x.hoan_tat)}</div></td></tr>`).join('')}</tbody></table></div></div>
    <div class="bx-notes"><b>NGUYÊN TẮC TRIỂN KHAI / NGHIỆM THU</b>${(B.an_toan||[]).map(t=>`<div>• ${esc(t)}</div>`).join('')}</div></div>`;
}
function priorityPng(){
  const B = BX; if(!B) return;
  const L = B.uu_tien||[], W = 2000, P = 50, cw = [230, 480, 600, 590], F = '"Segoe UI", Arial, "Noto Sans", sans-serif';
  const cv = document.createElement("canvas"), g = cv.getContext("2d");
  const wrap = (txt, w, font) => { g.font = font; const out = []; String(txt||"").split("\n").forEach(par=>{ let line = "";
      par.split(" ").forEach(wd=>{ const t = line ? line+" "+wd : wd; if(g.measureText(t).width > w && line){ out.push(line); line = wd; } else line = t; }); out.push(line); }); return out; };
  const rows = L.map(x=>{
    const cols = [[[x.stt+"","bold 34px "+F],[x.han.toUpperCase(),"bold 24px "+F]],
      [[x.hang,"22px "+F],...wrap(x.station,cw[1]-30,"bold 26px "+F).map(l=>[l,"bold 26px "+F]),...wrap(x.device,cw[1]-30,"24px "+F).map(l=>[l,"24px "+F]),
        ...(x.serial?[["SN "+x.serial,"22px "+F]]:[])],
      wrap(x.evidence,cw[2]-30,"25px "+F).map(l=>[l,"25px "+F]),
      wrap(x.de_xuat,cw[3]-30,"25px "+F).map(l=>[l,"25px "+F]).concat(wrap("Hoàn tất khi: "+x.hoan_tat,cw[3]-30,"italic 23px "+F).map(l=>[l,"italic 23px "+F]))];
    return {x, cols, h: Math.max(...cols.map(c=>c.length))*35 + 30};
  });
  const notes = (B.an_toan||[]).flatMap(t=>wrap("• "+t, W-2*P, "24px "+F));
  const H = 330 + 64 + rows.reduce((a,r)=>a+r.h,0) + 80 + notes.length*34 + 40;
  cv.width = W; cv.height = H;
  g.fillStyle = "#f3f5fa"; g.fillRect(0,0,W,H); g.fillStyle = "#1c3248"; g.fillRect(0,0,W,220);
  g.fillStyle = "#fff"; g.font = "bold 56px "+F; g.fillText("10 VIỆC ƯU TIÊN CẢI THIỆN VẬN HÀNH", P, 90);
  g.font = "32px "+F; g.fillStyle = "#dfe7f2"; g.fillText(`HIỆP MINH THỊNH · gộp mọi hãng | Đề xuất lúc ${bxTime(B.luc)}`, P, 145);
  g.font = "24px "+F; g.fillText(`xuất lúc ${new Date().toLocaleString("vi-VN")}`, P, 190);
  g.fillStyle = "#1c2733"; g.font = "bold 32px "+F; g.fillText("Ưu tiên lỗi có bằng chứng trước, sau đó xác minh sản lượng riêng thấp.", P, 275);
  g.font = "24px "+F; g.fillStyle = "#5b6878"; g.fillText("Đây là danh sách giao việc, không phải xếp hạng hiệu suất. Hạn dưới đây là đề xuất.", P, 312);
  let y = 330; g.fillStyle = "#1c3248"; g.fillRect(P, y, W-2*P, 64); g.fillStyle = "#fff"; g.font = "bold 27px "+F;
  let x0 = P; ["Ưu tiên / hạn","Hãng / nhà máy","Bằng chứng đã có","Giao việc và tiêu chí hoàn tất"].forEach((h,j)=>{ g.fillText(h, x0+16, y+42); x0 += cw[j]; }); y += 64;
  rows.forEach((r,k)=>{
    g.fillStyle = r.x.han==="Ngay"||r.x.han==="Trong ngày" ? "#fdf0ea" : (k%2 ? "#eef2f7" : "#fff"); g.fillRect(P, y, W-2*P, r.h);
    g.strokeStyle = "#cfd8e3"; g.lineWidth = 2; g.strokeRect(P, y, W-2*P, r.h);
    let xx = P; r.cols.forEach((col,j)=>{ if(j){ g.beginPath(); g.moveTo(xx,y); g.lineTo(xx,y+r.h); g.stroke(); }
      col.forEach(([l,f],m)=>{ g.font = f; g.fillStyle = j===0&&m===1 ? "#a83a3f" : "#1c2733"; g.fillText(l, xx+16, y+42+m*35); }); xx += cw[j]; });
    y += r.h;
  });
  y += 30; g.fillStyle = "#1c2733"; g.font = "bold 30px "+F; g.fillText("NGUYÊN TẮC TRIỂN KHAI / NGHIỆM THU", P, y+20);
  g.fillStyle = "#5b6878"; notes.forEach((l,i)=>{ g.font = "24px "+F; g.fillText(l, P, y+60+i*34); });
  cv.toBlob(b=>{ const a = document.createElement("a"); a.href = URL.createObjectURL(b);
    a.download = `10_viec_uu_tien_${(B.luc||"").slice(0,16).replace(/[-:T]/g,"")}.png`; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 2000); }, "image/png");
}
// ------------------------------------------------ NGHIỆM THU khi đóng việc
function acceptanceHtml(L){
  if(!L || !L.length) return '<div class="card empty">Chưa có việc nào được nghiệm thu. Khi bấm "Lưu cách xử lý" trong cửa sổ sự cố, phần mềm tự ghi số đo trước - sau, mã lỗi, SN, thời điểm và so kWh/kWp các ngày nắng tương đồng.</div>';
  const fmtS = o => !o || !Object.keys(o).length ? '—' : [o.luc?o.luc.slice(11,16)+' '+o.luc.slice(8,10)+'/'+o.luc.slice(5,7):'', o.kw!=null?o.kw.toFixed(1)+' kW':'', o.nhiet!=null?o.nhiet.toFixed(0)+'°C':'',
    o.riso!=null?'cách điện '+(o.riso*1000).toFixed(0)+' kΩ':'', o.nhanh?Object.entries(o.nhanh).filter(([k,v])=>v<0.3).length+' nhánh ~0 A':''].filter(Boolean).join(' · ');
  return `<div class="card"><h2>Nghiệm thu khi đóng việc <span class="more">${L.length} việc · 60 ngày</span></h2><div class="tw"><table class="bx-tb"><thead><tr><th>Đóng lúc / trạm / thiết bị</th><th>Mã lỗi · cách xử lý</th><th>Số đo trước → sau</th><th>kWh/kWp ngày nắng tương đồng</th></tr></thead><tbody>
    ${L.map(r=>{ const c = r.so_sanh;
      return `<tr><td><b>${esc(bxTime(r.dong_luc))}</b><div><a class="bx-st" href="${stUrl(r.vendor+'|'+r.station_code)}">${esc(r.station)}</a></div>${r.serial?`<div class="bx-sn">SN ${esc(r.serial)}</div>`:''}</td>
        <td>${esc(r.ma_loi)}<div class="bx-sn">từ ${esc(bxTime(r.bat_dau))}</div><div>${esc(r.cach_xu_ly||'')}</div>${r.ghi_tay?`<div class="bx-done">Ghi tay: ${esc(r.ghi_tay)}</div>`:''}</td>
        <td>Trước: ${esc(fmtS(r.truoc))}<br>Sau: ${esc(fmtS(r.sau))}</td>
        <td>${!c?'<span class="muted">chưa đủ số liệu bức xạ</span>':c.sau==null?`Trước: <b>${String(c.truoc).replace('.',',')}</b> ${esc(r.don_vi)} (${c.ngay_truoc} ngày nắng)<div class="bx-sn">Sau: chưa đủ ngày nắng tương đồng (${c.ngay_sau}/2)</div>`
          :`Trước <b>${String(c.truoc).replace('.',',')}</b> → sau <b>${String(c.sau).replace('.',',')}</b> ${esc(r.don_vi)} <span class="bx-c ${c.chenh>=0?'bx-cp':'bx-cm'}">${c.chenh>=0?'+':''}${String(c.chenh).replace('.',',')}%</span><div class="bx-sn">${c.ngay_truoc} ngày trước / ${c.ngay_sau} ngày sau, bức xạ lệch ≤ 15%</div>`}</td></tr>`; }).join('')}</tbody></table></div>
    <p class="muted" style="font-size:12px;margin:8px 0 0">Ngày nắng: bức xạ ≥ 75% ngày nắng nhất trước sự cố; tương đồng: bức xạ lệch ≤ 15%. Cần ≥ 2 ngày sau sửa mới so. Chưa đủ dữ liệu để cam kết mức tăng kWh.</p></div>`;
}
