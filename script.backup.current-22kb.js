const loader=document.getElementById("loader"),skip=document.getElementById("skip");
function closeLoader(){if(!loader)return;loader.classList.add("hide");setTimeout(()=>loader.remove(),550)}
skip?.addEventListener("click",closeLoader);setTimeout(closeLoader,2500);

const KEY="rv_flowercraft_v15";
const OLD_KEY="rv_flowercraft_v14";
const defaults={
  store:{name:"RV FLOWERCRAFT",phone:"085167605533",address:"Peranap, Pandan Wangi",hours:"Setiap hari",instagram:"@rv flowercraft",welcome:"RV FLOWERCRAFT menyediakan buket dan bunga pilihan untuk menemani momen spesial. Pesan bunga favoritmu dengan mudah melalui WhatsApp."},
  products:[]
};
let db=loadDB();

function cloneDefaults(){return JSON.parse(JSON.stringify(defaults))}
function loadDB(){
  try{
    const current=JSON.parse(localStorage.getItem(KEY)||"null");
    if(current){return {...cloneDefaults(),...current,store:{...defaults.store,...(current.store||{})},products:Array.isArray(current.products)?current.products:[]}}
    const old=JSON.parse(localStorage.getItem(OLD_KEY)||"null");
    if(old){
      return {store:{...defaults.store,...(old.store||{})},products:Array.isArray(old.products)?old.products:[]};
    }
  }catch(e){}
  return cloneDefaults();
}
function saveDB(){
  try{
    localStorage.setItem(KEY,JSON.stringify(db));
    renderAll();
    return true;
  }catch(e){
    console.error("Gagal menyimpan data katalog:",e);
    toast("Penyimpanan penuh. Coba foto yang lebih kecil atau hapus produk lama.");
    return false;
  }
}
function rupiah(n){return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0)}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.remove("show"),2200)}

const pages=[...document.querySelectorAll(".page")],nav=[...document.querySelectorAll(".nav")],buttons=[...document.querySelectorAll("[data-page]")];
function go(name){
  pages.forEach(p=>p.classList.toggle("active",p.id===name));
  nav.forEach(n=>n.classList.toggle("active",n.dataset.page===name));
  scrollTo({top:0,behavior:"smooth"});
  if(name==="owner") updateVisitorInfo();
}
buttons.forEach(b=>b.addEventListener("click",()=>go(b.dataset.page)));

document.querySelectorAll(".chip").forEach(c=>c.addEventListener("click",()=>{
  document.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));c.classList.add("active");
  renderProducts(c.dataset.category||"Semua");
}));

function waNumber(){return String(db.store.phone||"").replace(/\D/g,"").replace(/^0/,"62")}
function whatsappMessage(p){
  return `Halo RV FLOWERCRAFT 👋\n\nSaya tertarik dengan produk:\n🌸 ${p.name}\n💰 ${rupiah(p.price)}\n🌿 Kategori: ${p.category}\n\nApakah produk ini masih tersedia?`;
}
function openWhatsApp(p){
  const phone=waNumber();
  if(!phone){toast("Nomor WhatsApp pemilik belum diatur");go("owner");return}
  const url=`https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage(p))}`;
  window.open(url,"_blank","noopener");
}

function productCard(p){
  const image=p.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}" onerror="this.style.display='none'">`:`<div class="product-placeholder">✿</div>`;
  return `<article class="product-card">${image}<div class="product-body"><small>${esc(p.category)}</small><h3>${esc(p.name)}</h3><p>${esc(p.desc||"Produk pilihan RV FLOWERCRAFT.")}</p><strong>${rupiah(p.price)}</strong><div class="product-actions"><button class="pill wa-btn" data-wa="${esc(p.id)}">💬 Chat WhatsApp</button><button class="card-btn" data-card="${esc(p.id)}" type="button">💌 Kartu ucapan</button><button class="card-btn custom-btn" data-custom="${esc(p.id)}" type="button">🎨 Custom Pesanan</button></div></div></article>`;
}
function bindWaButtons(root){
  root.querySelectorAll("[data-wa]").forEach(b=>b.onclick=()=>{const p=db.products.find(x=>x.id===b.dataset.wa);if(p)openWhatsApp(p)})
  root.querySelectorAll("[data-wa]").forEach(b=>b.onclick=()=>{const p=db.products.find(x=>x.id===b.dataset.wa);if(p)openWhatsApp(p)}); root.querySelectorAll("[data-card]").forEach(b=>b.onclick=()=>{const p=db.products.find(x=>x.id===b.dataset.card);if(p)openCard(p)}); root.querySelectorAll("[data-custom]").forEach(b=>b.onclick=()=>{const p=db.products.find(x=>x.id===b.dataset.custom);if(p)openCustomModal(p)});
}
let cardProductData=null;
function openCard(p){
  cardProductData=p;
  const modal=document.getElementById("cardModal");
  document.getElementById("cardProduct").textContent=`Untuk pesanan: ${p.name} · ${rupiah(p.price)}`;
  document.getElementById("cardTo").value="";
  document.getElementById("cardFrom").value="";
  document.getElementById("cardMessage").value="";
  updateCardPreview();
  modal.hidden=false;
  document.body.classList.add("modal-open");
  setTimeout(()=>document.getElementById("cardMessage")?.focus(),80);
}
function closeCard(){document.getElementById("cardModal").hidden=true;document.body.classList.remove("modal-open");cardProductData=null}
function updateCardPreview(){
  const to=document.getElementById("cardTo").value.trim();
  const from=document.getElementById("cardFrom").value.trim();
  const msg=document.getElementById("cardMessage").value.trim();
  document.getElementById("cardCount").textContent=document.getElementById("cardMessage").value.length;
  let text=msg||"Pesan ucapanmu akan tampil di sini.";
  if(to)text=`Untuk ${to}\n\n${text}`;
  if(from)text+=`\n\n— ${from}`;
  document.getElementById("cardPreviewText").textContent=text;
}
function sendCardWhatsApp(){
  if(!cardProductData)return;
  const msg=document.getElementById("cardMessage").value.trim();
  if(!msg){toast("Tulis pesan ucapan dulu 💌");return}
  const to=document.getElementById("cardTo").value.trim();
  const from=document.getElementById("cardFrom").value.trim();
  const phone=waNumber();
  if(!phone){toast("Nomor WhatsApp pemilik belum diatur");closeCard();go("owner");return}
  const lines=["Halo RV FLOWERCRAFT 👋","","Saya ingin memesan produk dengan kartu ucapan:",`🌸 Produk: ${cardProductData.name}`,`💰 Harga: ${rupiah(cardProductData.price)}`];
  if(to)lines.push(`🎁 Untuk: ${to}`);
  if(from)lines.push(`✍️ Dari: ${from}`);
  lines.push("","💌 Pesan kartu ucapan:",msg,"","Apakah produk ini masih tersedia?");
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`,"_blank","noopener");
  closeCard();
}
['cardTo','cardFrom','cardMessage'].forEach(id=>document.getElementById(id)?.addEventListener('input',updateCardPreview));
document.getElementById("cardClose")?.addEventListener("click",closeCard);
document.getElementById("cardBackdrop")?.addEventListener("click",closeCard);
document.getElementById("cardSend")?.addEventListener("click",sendCardWhatsApp);
function renderProducts(category="Semua"){
  const list=category==="Semua"?db.products:db.products.filter(p=>p.category===category);
  document.getElementById("productCount").textContent=`${db.products.length} produk`;
  const grid=document.getElementById("productGrid");
  grid.innerHTML=list.length?list.map(productCard).join(""):`<div class="empty-card large"><div class="flower-mark">✿</div><h3>Katalog masih kosong</h3><p>Produk yang ditambahkan owner akan tampil di sini.</p><button class="outline" id="emptyOwner">＋ Tambah produk</button></div>`;
  bindWaButtons(grid);document.getElementById("emptyOwner")?.addEventListener("click",()=>go("owner"));
}
function renderHome(){
  document.getElementById("homeCount").textContent=`${db.products.length} produk`;
  const grid=document.getElementById("homeProducts");
  grid.innerHTML=db.products.length?db.products.slice(0,6).map(productCard).join(""):`<div class="empty-card"><div class="flower-mark">✿</div><h3>Belum ada produk</h3><p>Tambahkan produk dari Dashboard owner.</p><button class="outline" id="homeOwner">Tambah katalog</button></div>`;
  bindWaButtons(grid);document.getElementById("homeOwner")?.addEventListener("click",()=>go("owner"));
  document.getElementById("storeWelcome").textContent=db.store.welcome||defaults.store.welcome;
}

function renderOwner(){
  document.getElementById("statProducts").textContent=db.products.length;
  const phone=waNumber();
  document.getElementById("statPhone").textContent=phone?"✓":"—";
  document.getElementById("sName").value=db.store.name||"";
  document.getElementById("sPhone").value=db.store.phone||"";
  document.getElementById("sAddress").value=db.store.address||"";
  document.getElementById("sHours").value=db.store.hours||"";
  document.getElementById("sInstagram").value=db.store.instagram||"";
  document.getElementById("sWelcome").value=db.store.welcome||"";
  const box=document.getElementById("ownerProducts");
  box.innerHTML=db.products.length?db.products.map(p=>`<div class="owner-product"><div class="owner-product-main">${p.image?`<img src="${esc(p.image)}" alt="">`:`<span class="mini-flower">✿</span>`}<div><b>${esc(p.name)}</b><small>${esc(p.category)} · ${rupiah(p.price)}</small></div></div><button class="danger" data-del="${esc(p.id)}">Hapus</button></div>`).join(""):"<p class='muted'>Belum ada produk.</p>";
  box.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>deleteProduct(b.dataset.del));
  updateVisitorInfo();
}
function deleteProduct(id){
  const p=db.products.find(x=>x.id===id);if(!p)return;
  if(!confirm(`Hapus produk "${p.name}"?`))return;
  db.products=db.products.filter(x=>x.id!==id);saveDB();toast("Produk dihapus");
}

let selectedImageData="";
const pImageFile=document.getElementById("pImageFile"),imagePreview=document.getElementById("imagePreview");
pImageFile?.addEventListener("change",()=>{
  const file=pImageFile.files?.[0];
  if(!file){selectedImageData="";imagePreview.hidden=true;imagePreview.innerHTML="";return;}
  if(!file.type.startsWith("image/")){toast("File harus berupa gambar");pImageFile.value="";return;}
  if(file.size>3*1024*1024){toast("Gunakan gambar maksimal 3 MB");pImageFile.value="";return;}
  const reader=new FileReader();
  reader.onload=()=>{
    const img=new Image();
    img.onload=()=>{
      // Kompres foto agar aman disimpan di localStorage HP.
      const maxSide=1200;
      const scale=Math.min(1,maxSide/Math.max(img.width,img.height));
      const canvas=document.createElement("canvas");
      canvas.width=Math.max(1,Math.round(img.width*scale));
      canvas.height=Math.max(1,Math.round(img.height*scale));
      const ctx=canvas.getContext("2d");
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      selectedImageData=canvas.toDataURL("image/jpeg",0.72);
      imagePreview.innerHTML=`<img src="${selectedImageData}" alt="Preview gambar"><button type="button" class="remove-image" id="removeImage">× Hapus gambar</button>`;
      imagePreview.hidden=false;
      document.getElementById("removeImage").onclick=()=>{selectedImageData="";pImageFile.value="";imagePreview.hidden=true;imagePreview.innerHTML=""};
    };
    img.onerror=()=>{toast("Foto tidak bisa diproses");pImageFile.value=""};
    img.src=reader.result;
  };
  reader.readAsDataURL(file);
});


/* Harga Rupiah: izinkan input 53.000 tetapi simpan sebagai angka 53000 */
const priceInput=document.getElementById("pPrice");
function formatPriceInput(){
  if(!priceInput)return;
  const digits=priceInput.value.replace(/\D/g,"");
  priceInput.value=digits?new Intl.NumberFormat("id-ID").format(Number(digits)):"";
}
priceInput?.addEventListener("input",formatPriceInput);
priceInput?.addEventListener("blur",formatPriceInput);
function parseRupiah(value){
  const digits=String(value||"").replace(/\D/g,"");
  return digits?Number(digits):0;
}

document.getElementById("productForm").addEventListener("submit",e=>{
  e.preventDefault();
  const p={id:"p"+Date.now(),name:document.getElementById("pName").value.trim(),price:parseRupiah(document.getElementById("pPrice").value),category:document.getElementById("pCategory").value,image:selectedImageData,desc:document.getElementById("pDesc").value.trim()};
  if(!p.name||p.price<0)return;
  const oldProducts=db.products;
  db.products=[p,...db.products];
  if(saveDB()){
    selectedImageData="";e.target.reset();imagePreview.hidden=true;imagePreview.innerHTML="";
    toast("Produk berhasil ditambahkan");
  }else{
    db.products=oldProducts;
  }
});

document.getElementById("storeForm").addEventListener("submit",e=>{
  e.preventDefault();
  let phone=document.getElementById("sPhone").value.trim().replace(/\D/g,"");
  if(phone.startsWith("0"))phone="62"+phone.slice(1);
  db.store={name:document.getElementById("sName").value.trim()||"RV FLOWERCRAFT",phone,address:document.getElementById("sAddress").value.trim()||defaults.store.address,hours:document.getElementById("sHours").value.trim()||defaults.store.hours,instagram:document.getElementById("sInstagram").value.trim()||defaults.store.instagram,welcome:document.getElementById("sWelcome").value.trim()||defaults.store.welcome};
  saveDB();toast("Pengaturan toko disimpan");
});

document.getElementById("instagramBtn").onclick=()=>{
  const handle=String(db.store.instagram||"").trim().replace(/^@/,'');
  if(!handle){toast("Instagram toko belum diatur");return;}
  window.open(`https://instagram.com/${encodeURIComponent(handle)}`,"_blank","noopener");
};
document.getElementById("profileWaBtn").onclick=()=>{
  const phone=waNumber();
  if(!phone){toast("Nomor WhatsApp pemilik belum diatur");go("owner");return;}
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent("Halo RV FLOWERCRAFT 👋 Saya ingin bertanya tentang produk yang tersedia.")}`,"_blank","noopener");
};
document.getElementById("shareBtn").onclick=async()=>{
  const data={title:db.store.name||"RV FLOWERCRAFT",text:"Yuk lihat katalog RV FLOWERCRAFT!",url:location.href};
  try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(location.href);toast("Link toko disalin")}}catch(e){}
};
document.getElementById("ownerBtn").onclick=()=>go("owner");
document.getElementById("menuBtn").onclick=()=>go("profile");
document.getElementById("resetBtn").onclick=()=>{
  if(confirm("Reset semua produk dan pengaturan toko di browser ini?")){db=cloneDefaults();localStorage.removeItem(KEY);saveDB();toast("Data toko direset")}
};

function detectDevice(){
  const ua=navigator.userAgent||"";
  if(/iPad|Tablet|Android(?!.*Mobile)/i.test(ua))return "Tablet";
  if(/Android/i.test(ua))return "Android";
  if(/iPhone|iPod/i.test(ua))return "iPhone";
  if(/Macintosh|Mac OS X/i.test(ua))return "Mac";
  if(/Windows/i.test(ua))return "Windows";
  if(/Linux/i.test(ua))return "Linux";
  return "Unknown";
}
function detectBrowser(){
  const ua=navigator.userAgent||"";
  if(/Edg\//i.test(ua))return "Edge";
  if(/OPR\//i.test(ua))return "Opera";
  if(/SamsungBrowser/i.test(ua))return "Samsung Internet";
  if(/Firefox\//i.test(ua))return "Firefox";
  if(/CriOS\//i.test(ua)||/Chrome\//i.test(ua))return "Chrome";
  if(/Safari\//i.test(ua)&&!/Chrome|CriOS/i.test(ua))return "Safari";
  return "Browser";
}
function detectCountry(){
  const lang=(navigator.language||"").toLowerCase();
  const tz=Intl.DateTimeFormat().resolvedOptions().timeZone||"";
  if(lang.startsWith("id")||/^Asia\/(Jakarta|Makassar|Jayapura)$/.test(tz))return "🇮🇩 Indonesia";
  if(lang.startsWith("ms")||tz.startsWith("Asia/Kuala_Lumpur")||tz.startsWith("Asia/Singapore"))return "🇲🇾 Malaysia";
  if(lang.startsWith("en-us"))return "🇺🇸 United States";
  if(lang.startsWith("en-gb"))return "🇬🇧 United Kingdom";
  return "Tidak diketahui";
}
function updateVisitorInfo(){
  const online=navigator.onLine!==false;
  document.getElementById("visitorCountry").textContent=detectCountry();
  document.getElementById("visitorDevice").textContent=detectDevice();
  document.getElementById("visitorBrowser").textContent=detectBrowser();
  document.getElementById("visitorStatus").textContent=online?"Online":"Offline";
  document.getElementById("visitorScreen").textContent=`${screen.width} × ${screen.height}`;
  const dot=document.querySelector(".online-dot");
  dot.innerHTML=online?"<i></i> Online":"<i class=\"offline\"></i> Offline";
  const bar=document.getElementById("batteryBar"),text=document.getElementById("visitorBattery");
  if(navigator.getBattery){navigator.getBattery().then(b=>{
    const value=Math.round(b.level*100);bar.style.width=value+"%";text.textContent=value+"%";
    bar.classList.toggle("low",value<20);
  }).catch(()=>{text.textContent="Tidak tersedia";bar.style.width="0"})}else{text.textContent="Tidak tersedia";bar.style.width="0"}
}
window.addEventListener("online",updateVisitorInfo);window.addEventListener("offline",updateVisitorInfo);updateVisitorInfo();

function renderAll(){
  document.title=db.store.name||"RV FLOWERCRAFT";
  document.getElementById("profileTitle").textContent=db.store.name||"RV FLOWERCRAFT";
  document.getElementById("profileName").textContent=db.store.name||"RV FLOWERCRAFT";
  document.getElementById("profileDesc").textContent=db.store.welcome||defaults.store.welcome;
  document.getElementById("profilePhone").textContent=waNumber()?`+${waNumber()}`:"Belum diatur";
  document.getElementById("profileAddress").textContent=db.store.address||defaults.store.address;
  document.getElementById("profileHours").textContent=db.store.hours||defaults.store.hours;
  document.getElementById("profileInstagram").textContent=db.store.instagram||defaults.store.instagram;
  renderHome();renderProducts(document.querySelector(".chip.active")?.dataset.category||"Semua");
  if(document.getElementById("owner").classList.contains("active"))renderOwner();
}
go("home");renderAll();

/* Music player */
const musicAudio=document.getElementById("musicAudio"),musicPlayer=document.querySelector(".music-player"),muteBtn=document.getElementById("muteBtn"),playBtn=document.getElementById("playBtn"),nextBtn=document.getElementById("nextBtn");
const tracks=[{name:"Godtazte",src:"assets/godtazte.mp3"},{name:"Raavfy",src:"assets/raavfy.mp3"},{name:"Lagu 3",src:"assets/lagu3.mp3"},{name:"Lagu 4",src:"assets/lagu4.mp3"}];let trackIndex=0;
musicAudio.src=tracks[0].src;musicAudio.volume=.75;
function updateMusicUI(){const playing=!musicAudio.paused;musicPlayer.classList.toggle("playing",playing);playBtn.textContent=playing?"Ⅱ":"▶";muteBtn.textContent=musicAudio.muted?"🔇":"🔊";musicPlayer.title=tracks[trackIndex].name}
async function playMusic(){try{await musicAudio.play()}catch(e){}updateMusicUI()}
playBtn.onclick=()=>musicAudio.paused?playMusic():(musicAudio.pause(),updateMusicUI());
muteBtn.onclick=()=>{musicAudio.muted=!musicAudio.muted;updateMusicUI()};
nextBtn.onclick=()=>{trackIndex=(trackIndex+1)%tracks.length;musicAudio.src=tracks[trackIndex].src;playMusic()};
musicAudio.onended=()=>{trackIndex=(trackIndex+1)%tracks.length;musicAudio.src=tracks[trackIndex].src;playMusic()};
updateMusicUI();




/* Waktu Salat Riau — data lokal dari prayer_times.json */
const prayerNames=["Imsak","Subuh","Terbit","Dzuhur","Ashar","Maghrib","Isya"];
const prayerIcons={Imsak:"🌙",Subuh:"🌅",Terbit:"☀️",Dzuhur:"☀️",Ashar:"🌤️",Maghrib:"🌇",Isya:"🌙"};
let prayerData={};
const prayerRegion=document.getElementById("prayerRegion");
async function loadPrayerData(){
  try{
    const r=await fetch("prayer_times.json",{cache:"no-store"}); prayerData=await r.json();
    prayerRegion.innerHTML=Object.keys(prayerData).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("");
    const saved=localStorage.getItem("rv_flowercraft_prayer_region");
    if(saved && prayerData[saved]) prayerRegion.value=saved;
    renderPrayer();
  }catch(e){
    prayerRegion.innerHTML='<option>Data salat gagal dimuat</option>';
    toast("Data waktu salat tidak bisa dimuat");
  }
}
function getPrayerRow(){
  const rows=prayerData[prayerRegion?.value]?.rows||[];
  const now=new Date();
  const key=String(now.getDate()).padStart(2,"0")+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+now.getFullYear();
  return rows.find(x=>x.Tanggal===key)||rows[0];
}
function renderPrayer(){
  const region=prayerRegion?.value||"Pekanbaru"; const row=getPrayerRow();
  if(!row)return;
  localStorage.setItem("rv_flowercraft_prayer_region",region);
  document.getElementById("prayerLocation").textContent=region;
  const d=row.Tanggal.split("-").reverse().join("/");
  document.getElementById("prayerDate").textContent=`${row.Hari}, ${d}`;
  const grid=document.getElementById("prayerGrid");
  grid.innerHTML=prayerNames.map(n=>`<div class="prayer-item" data-prayer="${n}"><span>${prayerIcons[n]}</span><div><small>${n}</small><b>${row[n]||"—"}</b></div></div>`).join("");
  updateNextPrayer(row);
}
function updatePhoneClock(){
  const el=document.getElementById("phoneClock");
  if(!el)return;
  const now=new Date();
  el.textContent=now.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false});
}
function updateNextPrayer(row){
  const now=new Date(); let next=null;
  for(const n of prayerNames){
    const t=row[n]; if(!/^\d{2}:\d{2}$/.test(t||""))continue;
    const [h,m]=t.split(":").map(Number); const dt=new Date(now); dt.setHours(h,m,0,0);
    if(dt>now){next={name:n,time:t};break;}
  }
  const name=document.getElementById("nextPrayerName"),time=document.getElementById("nextPrayerTime");
  if(!next){name.textContent="Selesai hari ini";time.textContent="";}
  else {name.textContent=next.name; time.textContent=next.time;}
  document.querySelectorAll(".prayer-item").forEach(x=>x.classList.toggle("next",!!next&&x.dataset.prayer===next.name));
  updatePhoneClock();
}
prayerRegion?.addEventListener("change",renderPrayer);
setInterval(()=>{
  updatePhoneClock();
  if(document.getElementById("prayer")?.classList.contains("active")){
    const row=getPrayerRow();
    if(row)updateNextPrayer(row);
  }
},1000);
loadPrayerData();
