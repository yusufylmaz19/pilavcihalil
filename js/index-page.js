const icons = () => window.lucide?.createIcons();
const clean = value => String(value || '').replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '').trim();
const element = (tag, text, cls) => { const el = document.createElement(tag); el.textContent = text; if (cls) el.className = cls; return el; };
async function loadPage() {
  try {
    const response = await fetch('data.json'); if (!response.ok) throw new Error('Menu unavailable');
    const data = await response.json();
    const products = data.products || (data.menu?.categories || []).flatMap(c => c.items.map(p => ({...p, category:c.id})));
    const combos = (data.combos || []).filter(c => (c.group || 'duz') === 'duz').map(c => ({name:c.name, desc:c.items.map(i => `${i.portion !== 1 ? i.portion + ' × ' : ''}${i.name}`).join(' + '), price:c.items.reduce((sum,i) => sum + Math.round((products.find(p => p.name === i.name)?.price || 0) * i.portion),0)}));
    const groups = [{name:'Pilav & tavuk',items:combos.length ? combos : products.filter(p => ['pilavlar','tavuklar'].includes(p.category))},{name:'Çorbalar',items:products.filter(p => p.category === 'corbalar')},{name:'İçecekler',items:products.filter(p => p.category === 'icecekler')}].filter(g => g.items.length);
    const tabs = document.querySelector('.menu-tabs');
    function show(group, button) {
      tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      const list = document.getElementById('menu-list'); list.replaceChildren();
      group.items.forEach((item,i) => {
        const row = element('article','','menu-item'); const copy = element('div','');
        copy.append(element('h3',clean(item.name)),element('p',clean(item.desc)));
        const price = element('span',new Intl.NumberFormat('tr-TR').format(item.price) + ' ','price'); price.append(element('small','₺'));
        row.append(element('span',String(i+1).padStart(2,'0'),'item-number'),copy,price);list.append(row);
      });
    }
    groups.forEach((g,i) => {const button = element('button',g.name);button.type='button';button.onclick=()=>show(g,button);tabs.append(button);if(i===0)show(g,button);});
    const platforms = document.getElementById('platforms'); platforms.replaceChildren();
    (data.platforms || []).filter(p => p.active).forEach(p => {const a=element('a',clean(p.name));a.href=p.href;if(p.href.startsWith('http')){a.target='_blank';a.rel='noopener';}const icon=document.createElement('i');icon.dataset.lucide=p.href.startsWith('tel:')?'phone':'arrow-up-right';a.append(icon);platforms.append(a);});
    if(data.contact?.address){document.getElementById('address').textContent=data.contact.address.text;document.getElementById('maps-link').href=data.contact.address.maps_link;}
    if(data.contact?.hours){const box=document.getElementById('hours');box.replaceChildren();data.contact.hours.forEach(h=>{box.append(document.createTextNode(`${h.day}: ${h.open} – ${h.close}`),document.createElement('br'));});}
    if(data.contact?.phones){const box=document.getElementById('phones');box.replaceChildren();data.contact.phones.forEach(p=>{const a=element('a',p.number);a.href=p.href;box.append(a,document.createElement('br'));});}
    icons();
  } catch(error) {document.getElementById('menu-list').textContent='Menü şu an yüklenemiyor. PDF menüyü inceleyebilir veya telefonla sipariş verebilirsiniz.';console.warn(error);}
}
icons();loadPage();
