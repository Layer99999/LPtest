// 既存の計測を、公開モードかつ本番ドメインでだけ有効にします。
(() => {
  if (document.documentElement.dataset.mode !== 'production' || !['tigerlabo.com','www.tigerlabo.com'].includes(location.hostname)) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', 'G-8K4H98JX4Q', { allow_google_signals: false, allow_ad_personalization_signals: false, allow_enhanced_conversions: false });
  const script=document.createElement('script'); script.async=true;
  script.src='https://www.googletagmanager.com/gtag/js?id=G-8K4H98JX4Q'; document.head.append(script);
  const known=new Set(['start','custom','team','timeline','scope','price','fees','data','public','results']);
  const topic=x=>known.has(String(x).replace(/^faq-/,''))?String(x).replace(/^faq-/,''):'unknown';
  const track=name=>{try{window.gtag('event',name,{send_to:'G-8K4H98JX4Q'});}catch{}};
  const area=el=>el.closest('.help-widget')?'help':el.closest('.mobile-cta')?'sticky':el.closest('header')?'header':el.closest('footer')?'footer':el.closest('section[id]')?.id||'body';
  document.addEventListener('click',event=>{
    const a=event.target.closest?.('a[href]'); if(!a)return;
    let u;try{u=new URL(a.getAttribute('href'),location.href);}catch{return;}
    let destination='page';
    if(u.hostname==='docs.google.com'&&u.pathname.startsWith('/forms/'))destination='form';
    else if(['x.com','twitter.com'].includes(u.hostname))destination='x';
    else if(u.origin===location.origin&&u.hash)destination=u.hash.startsWith('#faq-')?'faq_'+topic(u.hash.slice(1)):u.hash.slice(1);
    else if(u.origin!==location.origin)destination='external';
    track('tl_btn_'+area(a)+'_'+destination);
  });
  document.querySelector('.help-toggle')?.addEventListener('click',()=>track('tl_help_open'));
  document.querySelector('.help-close')?.addEventListener('click',()=>track('tl_help_close'));
  document.querySelectorAll('[data-faq]').forEach(button=>button.addEventListener('click',()=>track('tl_help_topic_'+topic(button.dataset.faq))));
  document.getElementById('help-form')?.addEventListener('submit',()=>{track('tl_help_search');track('tl_help_answer_'+topic(document.querySelector('.help-result')?.dataset.answer));});
  document.querySelectorAll('#faq details[id]').forEach(el=>el.addEventListener('toggle',()=>{if(el.open)track('tl_faq_open_'+topic(el.id));}));
  const notice=document.querySelector('.guide-privacy');
  if(notice)notice.textContent='質問内容と流入元を案内の改善のために記録します。個人情報や機密情報は入力しないでください。';
})();

/* TIGERLABO question logging */
/* The deployment script substitutes the verified write-only Apps Script URL. */
(() => {
  const endpoint = 'https://script.google.com/macros/s/AKfycbze-2xXSe68CRQ7cJaUQxefaCmvtI6qHvkQoV33sRrwtwFkWxRQmY3-zT7ZIvYqvPIiaA/exec';
  if (document.documentElement.dataset.mode !== 'production' || !['tigerlabo.com','www.tigerlabo.com'].includes(window.location.hostname)) return;
  const allowedTopics = new Set(['start','custom','team','timeline','scope','price','fees','data','public','results']);
  const uuid = () => crypto.randomUUID();
  const current = new URL(window.location.href);
  const classify = (source,medium) => {
    if (['x','twitter','t.co','x.com','www.x.com','twitter.com','www.twitter.com','l.twitter.com'].includes(source.toLowerCase())) return 'X';
    return medium.toLowerCase()==='organic'?'検索':'それ以外';
  };
  function firstEntry() {
    const sourceParam=current.searchParams.get('utm_source');
    const mediumParam=current.searchParams.get('utm_medium');
    let source=sourceParam||'(direct)',medium=mediumParam||'(none)';
    if (!sourceParam && document.referrer) {
      try {
        const ref=new URL(document.referrer);
        if(!['tigerlabo.com','www.tigerlabo.com'].includes(ref.hostname)) {
          source=ref.hostname;
          medium=/(^|\.)(google\.[a-z.]+|bing\.com|search\.yahoo\.co\.jp|duckduckgo\.com)$/.test(source)?'organic':'referral';
        }
      } catch {}
    }
    return {id:uuid(),source,medium,campaign:current.searchParams.get('utm_campaign')||'',landing:current.pathname,group:classify(source,medium)};
  }
  let entry;
  try {
    const stored=JSON.parse(sessionStorage.getItem('tl_question_entry')||'null');
    entry=stored&&stored.id&&Date.now()-stored.savedAt<1800000?stored:firstEntry();
    sessionStorage.setItem('tl_question_entry',JSON.stringify({...entry,savedAt:Date.now()}));
  } catch {entry=firstEntry()}
  // Store only session-level acquisition data. Question text is never stored in the browser.
  let lastSubmit=0,lastQuestion='';
  function send(question,input,answer) {
    if(!endpoint.startsWith('https://script.google.com/macros/s/'))return;
    const text=String(question||'').trim();
    if(!text || text.length>80 || (lastQuestion===text && Date.now()-lastSubmit<1000))return;
    lastSubmit=Date.now();lastQuestion=text;
    const payload={version:1,id:uuid(),session:entry.id,question:text,input,answer:allowedTopics.has(answer)?answer:'unmatched',group:entry.group,source:entry.source,medium:entry.medium,campaign:entry.campaign,landing:entry.landing,page:current.pathname,test:current.searchParams.get('tl_test')==='1'};
    const body=JSON.stringify(payload);
    // The endpoint exposes no read route. Normal operation never downloads other questions.
    if(navigator.sendBeacon && navigator.sendBeacon(endpoint,new Blob([body],{type:'text/plain;charset=UTF-8'})))return;
    fetch(endpoint,{method:'POST',mode:'no-cors',credentials:'omit',headers:{'Content-Type':'text/plain;charset=UTF-8'},body,keepalive:true}).catch(()=>{});
  }
  document.querySelectorAll('[data-faq]').forEach(button=>button.addEventListener('click',()=>{
    send(button.textContent,'質問ボタン',button.dataset.faq.replace(/^faq-/,''));
  }));
  document.querySelector('#help-form')?.addEventListener('submit',()=>{
    const raw=document.querySelector('#help-query')?.value||'';
    // Use the existing helper's chosen result; keep the original question text unchanged.
    const heading=document.querySelector('.help-result h3')?.textContent;
    const faq=heading&&[...document.querySelectorAll('#faq details')].find(el=>el.querySelector('summary')?.textContent===heading);
    send(raw,'検索',faq?.id.replace(/^faq-/,'') || document.querySelector('.help-result')?.dataset.answer);
  });
})();
