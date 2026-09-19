const SUPABASE_URL="https://ftnarupbhwxzaitfzczq.supabase.co";
const SUPABASE_KEY="sb_publishable_n5n1qIaWIhr6H5z6e1ecRQ_q6lT05aa";
const supabaseClient=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

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
  const harga=effectivePrice(p);
  return `Halo RV FLOWERCRAFT 👋\n\nSaya tertarik dengan produk:\n🌸 ${p.name}\n💰 ${rupiah(harga)}${p.promo_active ? " (Harga Promo)" : ""}\n🌿 Kategori: ${p.category}\n\nApakah produk ini masih tersedia?`;
}
function openWhatsApp(p){
  const phone=waNumber();
  if(!phone){toast("Nomor WhatsApp pemilik belum diatur");go("owner");return}
  const url=`https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage(p))}`;
  window.open(url,"_blank","noopener");
}

function productCard(p){
  const image=p.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}" onerror="this.style.display='none'">`:`<div class="product-placeholder">✿</div>`;

  const normal=rupiah(p.price);
  const hasPromo=p.promo_active && Number(p.promo_price)>0 && Number(p.promo_price)<Number(p.price);

  const priceHTML=hasPromo
    ? `<div class="promo-price"><s class="price-old">${normal}</s><strong>${rupiah(p.promo_price)}</strong><small>🏷️ PROMO</small></div>`
    : `<strong>${normal}</strong>`;

  return `<article class="product-card">${image}<div class="product-body"><small>${esc(p.category)}</small><h3>${esc(p.name)}</h3><p>${esc(p.desc||"Produk pilihan RV FLOWERCRAFT.")}</p>${priceHTML}<div class="product-actions"><button class="pill wa-btn" data-wa="${esc(p.id)}">💬 Pesan via WhatsApp</button><button class="card-btn" data-card="${esc(p.id)}" type="button">💌 Kartu ucapan</button><button class="card-btn custom-btn" data-custom="${esc(p.id)}" type="button">🎨 Custom Pesanan</button></div></div></article>`;
}


function favoriteKey(id){
  return "rv_flowercraft_favorite_"+id;
}

function isProductFavorite(id){
  return localStorage.getItem(favoriteKey(id))==="1";
}

function updateFavoriteButton(p){
  const btn=document.getElementById("pdFavorite");
  if(!btn)return;

  const active=isProductFavorite(p.id);

  btn.textContent=active ? "♥ Favorit" : "♡ Favorit";
  btn.classList.toggle("favorite-active",active);
}

function toggleProductFavorite(p){
  if(!p)return;

  const key=favoriteKey(p.id);

  if(isProductFavorite(p.id)){
    localStorage.removeItem(key);
    toast("Dihapus dari favorit");
  }else{
    localStorage.setItem(key,"1");
    toast("Ditambahkan ke favorit ❤️");
  }

  updateFavoriteButton(p);
}

async function shareProduct(p){
  if(!p)return;

  const url=new URL(window.location.href);
  url.searchParams.set("product",p.id);

  const shareData={
    title:p.name || "RV FLOWERCRAFT",
    text:"Lihat produk "+(p.name||"RV FLOWERCRAFT")+" - "+rupiah(p.price),
    url:url.href
  };

  try{
    if(navigator.share){
      await navigator.share(shareData);
      return;
    }

    if(navigator.clipboard){
      await navigator.clipboard.writeText(url.href);
      toast("Link produk berhasil disalin 🔗");
      return;
    }

    prompt("Salin link produk ini:",url.href);

  }catch(err){
    if(err && err.name==="AbortError")return;

    try{
      await navigator.clipboard.writeText(url.href);
      toast("Link produk berhasil disalin 🔗");
    }catch(e){
      prompt("Salin link produk ini:",url.href);
    }
  }
}

function openProductDetail(p){
  if(!p)return;

  const modal=document.getElementById("productDetailModal");
  const img=document.getElementById("pdImage");
  const category=document.getElementById("pdCategory");
  const name=document.getElementById("pdName");
  const price=document.getElementById("pdPrice");
  const description=document.getElementById("pdDescription");
  const imageWrap=document.getElementById("pdImageWrap");

  category.textContent=p.category||"Produk";
  name.textContent=p.name||"Produk RV FLOWERCRAFT";
  price.textContent=rupiah(p.price);
  description.textContent=p.desc||p.description||"Produk pilihan RV FLOWERCRAFT.";

  imageWrap.classList.remove("zoomed");

  if(p.image){
    img.src=p.image;
    img.style.display="block";
  }else{
    img.removeAttribute("src");
    img.style.display="none";
  }

  modal.hidden=false;
  document.body.classList.add("pd-open");

  updateFavoriteButton(p);

  const favoriteBtn=document.getElementById("pdFavorite");
  const shareBtn=document.getElementById("pdShare");

  if(favoriteBtn){
    favoriteBtn.onclick=()=>{
      toggleProductFavorite(p);
    };
  }

  if(shareBtn){
    shareBtn.onclick=()=>{
      shareProduct(p);
    };
  }

  document.getElementById("pdOrder").onclick=()=>{
    openWhatsApp(p);
  };

  const pdCustom=document.getElementById("pdCustom");
  if(pdCustom){
    pdCustom.onclick=(e)=>{
      e.preventDefault();
      e.stopPropagation();
      openCustomModal(p);
    };
  }
}

function closeProductDetail(){
  const modal=document.getElementById("productDetailModal");
  if(modal)modal.hidden=true;
  document.body.classList.remove("pd-open");
}

document.addEventListener("click",e=>{
  const card=e.target.closest(".product-card");

  if(card && !e.target.closest("button,.wa-btn,.card-btn")){
    const buttons=card.querySelectorAll("[data-wa]");
    const id=buttons[0]?.dataset.wa;

    if(id){
      const p=db.products.find(x=>x.id===id);
      if(p)openProductDetail(p);
    }
  }
});

document.getElementById("pdClose")?.addEventListener("click",closeProductDetail);
document.getElementById("pdBackdrop")?.addEventListener("click",closeProductDetail);

document.getElementById("pdImageWrap")?.addEventListener("click",()=>{
  document.getElementById("pdImageWrap").classList.toggle("zoomed");
});

function bindWaButtons(root){
  root.querySelectorAll("[data-wa]").forEach(b=>b.onclick=()=>{const p=db.products.find(x=>x.id===b.dataset.wa);if(p)openWhatsApp(p)})
  root.querySelectorAll("[data-card]").forEach(b=>b.onclick=()=>{const p=db.products.find(x=>x.id===b.dataset.card);if(p)openCard(p)})
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
async function deleteProduct(id){
  const p=db.products.find(x=>x.id===id);
  if(!p)return;

  if(!confirm(`Hapus produk "${p.name}"?`))return;

  try{
    const {error}=await supabaseClient
      .from("products")
      .delete()
      .eq("id",id);

    if(error){
      console.error(error);
      toast("Gagal menghapus produk dari server");
      return;
    }

    db.products=db.products.filter(x=>x.id!==id);
    saveDB();
    renderOwner();
    renderProducts();
    renderHome();

    toast("Produk berhasil dihapus");
  }catch(err){
    console.error(err);
    toast("Terjadi kesalahan saat menghapus produk");
  }
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

document.getElementById("productForm").addEventListener("submit",async e=>{
  e.preventDefault();

  const btn=e.target.querySelector('button[type="submit"]');
  btn.disabled=true;
  btn.textContent="⏳ Menyimpan...";

  try{
    const {data:{user},error:userError}=await supabaseClient.auth.getUser();

    if(userError || !user){
      toast("Silakan login sebagai owner terlebih dahulu");
      return;
    }

    const name=document.getElementById("pName").value.trim();
    const price=parseRupiah(document.getElementById("pPrice").value);
    const category=document.getElementById("pCategory").value;
    const description=document.getElementById("pDesc").value.trim();

    let imageUrl=null;

    if(selectedImageData){
      const blob=await fetch(selectedImageData).then(r=>r.blob());
      const fileName=`products/${Date.now()}.jpg`;

      const {error:uploadError}=await supabaseClient
        .storage
        .from("product-images")
        .upload(fileName,blob,{
          contentType:"image/jpeg"
        });

      if(uploadError) throw uploadError;

      const {data:urlData}=supabaseClient
        .storage
        .from("product-images")
        .getPublicUrl(fileName);

      imageUrl=urlData.publicUrl;
    }

    const {data:product,error:insertError}=await supabaseClient
      .from("products")
      .insert({
        id:"p"+Date.now(),
        name:name,
        price:price,
        category:category,
        image:imageUrl,
        description:description
      })
      .select()
      .single();

    if(insertError) throw insertError;

    db.products=[{
      ...product,
      desc:product.description || ""
    },...db.products];

    selectedImageData="";
    e.target.reset();
    imagePreview.hidden=true;
    imagePreview.innerHTML="";

    renderAll();
    toast("Produk berhasil disimpan ke Supabase ✅");

  }catch(err){
    console.error(err);
    toast("Gagal menyimpan: "+(err.message || "Error"));
  }finally{
    btn.disabled=false;
    btn.textContent="＋ Tambah produk";
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
console.log("OWNER BUTTON SCRIPT AKTIF");
const ownerBtn=document.getElementById("ownerBtn");
const ownerLoginModal=document.getElementById("ownerLoginModal");
const ownerPassword=document.getElementById("ownerPassword");
const ownerLoginError=document.getElementById("ownerLoginError");

if(ownerBtn){
  ownerBtn.addEventListener("click",()=>{
    if(ownerLoginModal) ownerLoginModal.hidden=false;
    if(ownerPassword) ownerPassword.value="";
    if(ownerLoginError) ownerLoginError.textContent="";
  });
}
document.getElementById("ownerLoginForm")?.addEventListener("submit",async e=>{
  e.preventDefault();

  const email=document.getElementById("ownerEmail").value;
  const password=document.getElementById("ownerPassword").value;
  const errorBox=document.getElementById("ownerLoginError");

  const {error}=await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if(error){
    errorBox.textContent="Email atau password salah.";
    return;
  }

  document.getElementById("ownerLoginModal").hidden=true;
  go("owner");
  toast("Login owner berhasil ✓");
});
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
const tracks=[{name:"Godtazte",src:"assets/godtazte.mp3"},{name:"Raavfy",src:"assets/raavfy.mp3"}];let trackIndex=0;
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
async function loadProductsFromSupabase(){
  const {data,error}=await supabaseClient
    .from("products")
    .select("*")
    .order("created_at",{ascending:false});

  if(error){
    console.error("Gagal mengambil produk Supabase:",error);
    alert("SUPABASE ERROR: " + (error.message || JSON.stringify(error)));
    return;
  }

  db.products=(data||[]).map(p=>({
    ...p,
    desc:p.description||""
  }));

  renderAll();
}
loadProductsFromSupabase();


(function(){
  const search=document.getElementById("productSearch");
  const clear=document.getElementById("clearProductSearch");
  if(!search)return;

  search.addEventListener("input",function(){
    const q=this.value.trim().toLowerCase();
    const active=document.querySelector(".chip.active");
    const category=active ? active.dataset.category : "Semua";

    let products=db.products || [];

    if(category!=="Semua"){
      products=products.filter(p=>p.category===category);
    }

    if(q){
      products=products.filter(p=>{
        const text=[
          p.name,
          p.category,
          p.desc,
          p.description
        ].filter(Boolean).join(" ").toLowerCase();

        return text.includes(q);
      });
    }

    const grid=document.getElementById("productGrid");
    if(!grid)return;

    grid.innerHTML=products.length
      ? products.map(productCard).join("")
      : '<div class="search-empty"><div>🔎</div><h3>Produk tidak ditemukan</h3><p>Coba kata pencarian lain.</p></div>';

    bindWaButtons(grid);

    const count=document.getElementById("productCount");
    if(count){
      count.textContent=q
        ? products.length+" ditemukan"
        : (db.products||[]).length+" produk";
    }
  });

  clear?.addEventListener("click",function(){
    search.value="";
    search.dispatchEvent(new Event("input"));
    search.focus();
  });
})();


/* RV ONLINE ANALYTICS */
async function trackEvent(type, productId=null){
  try{
    await supabaseClient
      .from("store_analytics")
      .insert({
        event_type:type,
        product_id:productId
      });
  }catch(e){
    console.warn("Analytics:",e);
  }
}

function trackVisitor(){
  const key="rv_analytics_visitor_"+new Date().toISOString().slice(0,10);
  if(!sessionStorage.getItem(key)){
    sessionStorage.setItem(key,"1");
    trackEvent("visitor");
  }
}

function setupOnlineAnalytics(){
  trackVisitor();

  document.addEventListener("click",e=>{
    const wa=e.target.closest("[data-wa],#profileWaBtn");
    if(wa){
      trackEvent("whatsapp_click",wa.dataset.wa||null);
    }

    const share=e.target.closest("#shareBtn,#pdShare");
    if(share){
      trackEvent("link_click");
    }

    const card=e.target.closest("[data-card]");
    if(card){
      trackEvent("order_request",card.dataset.card||null);
    }
  });
}

setupOnlineAnalytics();

/* Catat saat detail produk dibuka */
const oldOpenProductDetail=window.openProductDetail;
if(typeof oldOpenProductDetail==="function"){
  window.openProductDetail=function(product){
    trackEvent("product_view",product?.id||null);
    return oldOpenProductDetail(product);
  };
}

/* Dashboard analytics */
async function loadAnalytics(){
  try{
    const {data,error}=await supabaseClient
      .from("store_analytics")
      .select("event_type,created_at");

    if(error) throw error;

    const today=new Date().toISOString().slice(0,10);
    const events=data||[];

    const count=(type,onlyToday=false)=>{
      return events.filter(x=>
        x.event_type===type &&
        (!onlyToday || String(x.created_at).slice(0,10)===today)
      ).length;
    };

    const set=(id,value)=>{
      const el=document.getElementById(id);
      if(el)el.textContent=value;
    };

    set("analyticsVisitors",count("visitor"));
    set("analyticsVisitorsToday",count("visitor",true));
    set("analyticsViews",count("product_view"));
    set("analyticsClicks",count("link_click"));
    set("analyticsWA",count("whatsapp_click"));
    set("analyticsOrders",count("order_request",true));

  }catch(e){
    console.warn("Gagal memuat analytics:",e);
  }
}

loadAnalytics();


/* Analytics refresh button */
document.getElementById("analyticsRefresh")?.addEventListener("click",async function(){
  this.disabled=true;
  this.textContent="…";
  try{
    await loadAnalytics();
    toast("Statistik diperbarui ✓");
  }finally{
    this.disabled=false;
    this.textContent="↻";
  }
});


/* RV PRODUCT PROMO SYSTEM */
function productPriceHTML(p){
  const normal=rupiah(p.price);

  if(p.promo_active && Number(p.promo_price)>0 && Number(p.promo_price)<Number(p.price)){
    return `<div class="promo-price">
      <s class="price-old">${normal}</s>
      <strong>${rupiah(p.promo_price)}</strong>
      <small>🏷️ PROMO</small>
    </div>`;
  }

  return `<strong>${normal}</strong>`;
}

function effectivePrice(p){
  return p.promo_active && Number(p.promo_price)>0 && Number(p.promo_price)<Number(p.price)
    ? Number(p.promo_price)
    : Number(p.price);
}

async function toggleProductPromo(id){
  const p=db.products.find(x=>x.id===id);
  if(!p)return;

  let active=!Boolean(p.promo_active);
  let promoPrice=p.promo_price;

  if(active){
    const input=prompt(
      `Harga promo untuk "${p.name}"\nHarga normal: ${rupiah(p.price)}\n\nMasukkan harga promo:`,
      promoPrice ? Number(promoPrice).toLocaleString("id-ID") : ""
    );

    if(input===null)return;

    promoPrice=parseRupiah(input);

    if(!promoPrice || promoPrice>=Number(p.price)){
      toast("Harga promo harus lebih rendah dari harga normal");
      return;
    }
  }else{
    promoPrice=null;
  }

  try{
    const {data,error}=await supabaseClient
      .from("products")
      .update({
        promo_price:active?promoPrice:null,
        promo_active:active
      })
      .eq("id",id)
      .select()
      .single();

    if(error)throw error;

    const updated={
      ...data,
      desc:data.description||""
    };

    db.products=db.products.map(x=>x.id===id?updated:x);

    saveDB();
    renderOwner();
    renderProducts();
    renderHome();

    toast(active?"Promo berhasil diaktifkan 🏷️":"Promo dimatikan");
  }catch(err){
    console.error(err);
    toast("Gagal mengubah promo");
  }
}

function renderPromoControl(p){
  const active=Boolean(p.promo_active);

  return `
    <div class="promo-control">
      <div>
        <small>Promo produk</small>
        <b>${active && p.promo_price ? rupiah(p.promo_price) : "Tidak aktif"}</b>
      </div>
      <button
        type="button"
        class="promo-toggle ${active?"active":""}"
        data-promo="${esc(p.id)}">
        ${active?"ON":"OFF"}
      </button>
    </div>
  `;
}

/* Tambahkan kontrol promo ke daftar Owner */
const oldRenderOwner=window.renderOwner;

if(typeof oldRenderOwner==="function"){
  window.renderOwner=function(){
    oldRenderOwner();

    const box=document.getElementById("ownerProducts");
    if(!box)return;

    box.querySelectorAll(".owner-product").forEach(row=>{
      const del=row.querySelector("[data-del]");
      if(!del)return;

      const id=del.dataset.del;
      const p=db.products.find(x=>x.id===id);
      if(!p)return;

      const control=document.createElement("div");
      control.innerHTML=renderPromoControl(p);
      row.appendChild(control.firstElementChild);
    });

    box.querySelectorAll("[data-promo]").forEach(btn=>{
      btn.onclick=()=>toggleProductPromo(btn.dataset.promo);
    });
  };
}



/* =========================================
   RV FLOWERCRAFT - CUSTOM PESANAN
========================================= */

let customProduct=null;

function openCustomModal(p){
  const modal=document.getElementById("customModal");
  if(!modal)return;

  customProduct=p;

  document.getElementById("customProduct").textContent=
    `${p.name} · ${effectivePrice(p) ? rupiah(effectivePrice(p)) : rupiah(p.price)}`;

  document.getElementById("customFlowerColor").value="";
  document.getElementById("customPaperColor").value="";

  updateCustomPreview();

  modal.hidden=false;
  document.body.classList.add("modal-open");
}

function closeCustomModal(){
  const modal=document.getElementById("customModal");
  if(!modal)return;

  modal.hidden=true;
  document.body.classList.remove("modal-open");
  customProduct=null;
}

function updateCustomPreview(){
  const flower=document.getElementById("customFlowerColor")?.value;
  const paper=document.getElementById("customPaperColor")?.value;
  const preview=document.getElementById("customPreview");

  if(!preview)return;

  if(!flower && !paper){
    preview.textContent="Pilih warna bunga dan warna kertas.";
    return;
  }

  preview.innerHTML=
    `🌸 Bunga: <b>${flower||"Belum dipilih"}</b><br>`+
    `📄 Kertas: <b>${paper||"Belum dipilih"}</b>`;
}

function sendCustomWhatsApp(){
  if(!customProduct)return;

  const flower=document.getElementById("customFlowerColor").value;
  const paper=document.getElementById("customPaperColor").value;

  if(!flower){
    toast("Pilih warna bunga terlebih dahulu");
    return;
  }

  if(!paper){
    toast("Pilih warna kertas terlebih dahulu");
    return;
  }

  const phone=waNumber();

  if(!phone){
    toast("Nomor WhatsApp pemilik belum diatur");
    return;
  }

  const price=effectivePrice(customProduct);

  const message=
`Halo RV FLOWERCRAFT 👋

Saya ingin custom pesanan:

🌸 Produk: ${customProduct.name}
💰 Harga: ${rupiah(price)}
🌿 Kategori: ${customProduct.category}

🎨 Detail Custom:
🌸 Warna bunga: ${flower}
📄 Warna kertas buket: ${paper}

Apakah bisa dibuat sesuai pilihan tersebut?`;

  const url=
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  window.open(url,"_blank","noopener");

  closeCustomModal();
}

/* Tombol Custom pada kartu produk */
function bindCustomButtons(root=document){
  root.querySelectorAll("[data-custom]").forEach(btn=>{
    btn.onclick=()=>{
      const p=db.products.find(x=>x.id===btn.dataset.custom);
      if(p)openCustomModal(p);
    };
  });
}

document.addEventListener("change",e=>{
  if(
    e.target.id==="customFlowerColor" ||
    e.target.id==="customPaperColor"
  ){
    updateCustomPreview();
  }
});

document.getElementById("customClose")
  ?.addEventListener("click",closeCustomModal);

document.getElementById("customBackdrop")
  ?.addEventListener("click",closeCustomModal);

document.getElementById("customSend")
  ?.addEventListener("click",sendCustomWhatsApp);

/* Bind ulang setelah katalog dirender */
const oldBindWaButtons=window.bindWaButtons;

if(typeof oldBindWaButtons==="function"){
  window.bindWaButtons=function(root){
    oldBindWaButtons(root);
    bindCustomButtons(root);
  };
}else{
  bindCustomButtons(document);
}



/* =================================
   RV FLOWERCRAFT - MINI GAME
   TANGKAP BUNGA
================================= */

(function(){

  let rvGameRunning = false;
  let rvScore = 0;
  let rvTime = 30;
  let rvTimer = null;

  function el(id){
    return document.getElementById(id);
  }

  function updateGame(){
    if(el("scoreValue"))
      el("scoreValue").textContent = rvScore;

    if(el("timeValue"))
      el("timeValue").textContent = rvTime;

    if(el("gameScore"))
      el("gameScore").textContent = rvScore + " Poin";
  }

  function spawnFlower(){

    if(!rvGameRunning) return;

    const area = el("gameArea");
    if(!area) return;

    area.querySelectorAll(".game-flower").forEach(x => x.remove());

    const flower = document.createElement("button");

    flower.type = "button";
    flower.className = "game-flower";

    const list = [
      "🌸",
      "🌷",
      "🌹",
      "🌻",
      "🌺",
      "💐"
    ];

    flower.textContent =
      list[Math.floor(Math.random() * list.length)];

    const maxX = Math.max(0, area.clientWidth - 65);
    const maxY = Math.max(0, area.clientHeight - 65);

    flower.style.left = Math.random() * maxX + "px";
    flower.style.top = Math.random() * maxY + "px";

    flower.onclick = function(e){

      e.stopPropagation();

      if(!rvGameRunning) return;

      rvScore++;
      updateGame();

      flower.remove();

      spawnFlower();
    };

    area.appendChild(flower);
  }

  function endGame(){

    rvGameRunning = false;

    clearInterval(rvTimer);
    rvTimer = null;

    const area = el("gameArea");

    if(area){

      area.querySelectorAll(".game-flower")
        .forEach(x => x.remove());

      area.innerHTML = `
        <div class="game-start-text">
          🏆
          <b>Game selesai!</b>
          <small>Skor kamu: ${rvScore} poin</small>
        </div>
      `;
    }

    if(el("gameMessage")){
      el("gameMessage").textContent =
        "Mantap! Coba lagi untuk memecahkan skor kamu 🌸";
    }

    if(el("startGameBtn")){
      el("startGameBtn").textContent = "🔄 Main Lagi";
    }
  }

  function startGame(){

    const area = el("gameArea");
    if(!area) return;

    clearInterval(rvTimer);

    rvGameRunning = true;
    rvScore = 0;
    rvTime = 30;

    updateGame();

    area.innerHTML = "";

    if(el("gameMessage")){
      el("gameMessage").textContent =
        "Cepat tangkap bunganya! 🌷";
    }

    if(el("startGameBtn")){
      el("startGameBtn").textContent =
        "🎮 Sedang Bermain...";
    }

    spawnFlower();

    rvTimer = setInterval(function(){

      rvTime--;

      updateGame();

      if(rvTime <= 0){
        endGame();
      }

    },1000);
  }

  document.addEventListener("click", function(e){

    if(e.target.closest("#startGameBtn")){
      startGame();
    }

  });

})();
