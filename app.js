(() => {
  'use strict';
  const headerPhoto = document.querySelector('[data-header-image]');
  if (headerPhoto && document.documentElement.dataset.mode === 'preview') {
    const choice = new URLSearchParams(location.search).get('header');
    if (/^(0[1-9]|1\d|20)$/.test(choice || '')) {
      headerPhoto.src = `header-photo-options/previews/hero-${choice}.jpg`;
      headerPhoto.dataset.headerChoice = choice;
      const focus = { '01':42, '02':50, '03':51, '04':52, '05':49, '06':54, '07':50, '08':55, '09':50, '10':48, '11':48, '12':59, '13':50, '14':45, '15':52, '16':49, '17':49, '18':49, '19':45, '20':52 };
      headerPhoto.style.setProperty('--header-photo-focus', `${focus[choice]}%`);
    }
  }
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobile-nav');
  const menuLabel = menuButton?.querySelector('span');
  const closeMenu = () => {
    if (!menuButton || !menu) return;
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    if (menuLabel) menuLabel.textContent = 'メニュー';
  };
  menuButton?.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    if (menuLabel) menuLabel.textContent = open ? '閉じる' : 'メニュー';
  });
  menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  const updateHeader = () => {
    if (header) document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`);
    if (window.innerWidth > 1080) closeMenu();
  };
  updateHeader();
  if (header && globalThis.ResizeObserver) new ResizeObserver(updateHeader).observe(header);
  window.addEventListener('resize', updateHeader);

  const sectionLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
  let scheduled = false;
  const markSection = () => {
    const line = (header?.offsetHeight || 80) + 95;
    let active = null;
    for (const a of sectionLinks) {
      const section = document.getElementById(a.hash.slice(1));
      if (section && section.getBoundingClientRect().top <= line) active = a;
    }
    sectionLinks.forEach(a => {
      if (a === active && !a.classList.contains('nav-contact')) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
    scheduled = false;
  };
  markSection();
  window.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(markSection); }
  }, { passive: true });

  const sticky = document.querySelector('.mobile-cta');
  const heroActions = document.querySelector('.hero .actions, .page-hero');
  const contact = document.getElementById('contact');
  if (sticky && heroActions && globalThis.IntersectionObserver) {
    let heroVisible = true;
    let contactVisible = false;
    const sync = () => sticky.classList.toggle('is-hidden', heroVisible || contactVisible);
    new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; sync(); }).observe(heroActions);
    if (contact) new IntersectionObserver(([entry]) => { contactVisible = entry.isIntersecting; sync(); }).observe(contact);
  }

  const openHashQuestion = () => {
    if (!location.hash.startsWith('#faq-')) return;
    const item = document.getElementById(location.hash.slice(1));
    if (item instanceof HTMLDetailsElement) item.open = true;
  };
  openHashQuestion();
  window.addEventListener('hashchange', openHashQuestion);

  const dialog = document.getElementById('guide-dialog');
  const toggle = document.querySelector('.guide-toggle');
  const close = document.querySelector('.guide-close');
  const form = document.getElementById('help-form');
  const query = document.getElementById('help-query');
  const result = document.querySelector('.help-result');
  const source = document.getElementById('guide-faq-data');
  if (!dialog || !toggle || !close || !form || !query || !result || !source) return;
  let faqs;
  try { faqs = JSON.parse(source.textContent); } catch { faqs = []; }
  const closeGuide = () => { if (dialog.open) dialog.close(); };
  toggle.addEventListener('click', () => {
    closeMenu();
    if (!dialog.open) {
      dialog.showModal();
      toggle.setAttribute('aria-expanded', 'true');
      close.focus();
    }
  });
  close.addEventListener('click', closeGuide);
  dialog.addEventListener('close', () => toggle.setAttribute('aria-expanded', 'false'));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeGuide();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.classList.contains('menu-open')) closeMenu();
  });
  document.querySelectorAll('.guide-bottom a').forEach(a => a.addEventListener('click', closeGuide));

  const showAnswer = id => {
    result.replaceChildren();
    const item = faqs.find(f => f.id === id);
    result.dataset.answer = item?.id || 'unmatched';
    if (!item) {
      const message = document.createElement('p');
      message.textContent = '該当する質問が見つかりませんでした。「料金」「期間」など、短いキーワードでお試しください。';
      const contactLink = document.createElement('a');
      contactLink.href = `${result.dataset.faqRoot || ''}#contact`;
      contactLink.textContent = '個別に相談する';
      contactLink.addEventListener('click', closeGuide);
      result.append(message, contactLink);
      return;
    }
    const title = document.createElement('h3');
    title.textContent = item.q;
    const answer = document.createElement('p');
    answer.textContent = item.a;
    const more = document.createElement('a');
    more.href = `${result.dataset.faqRoot || ''}#faq-${item.id}`;
    more.textContent = 'よくある質問で読む';
    more.addEventListener('click', () => {
      const target = document.getElementById(`faq-${item.id}`);
      if (target instanceof HTMLDetailsElement) target.open = true;
      closeGuide();
    });
    result.append(title, answer, more);
  };
  document.querySelectorAll('[data-faq]').forEach(button => button.addEventListener('click', () => showAnswer(button.dataset.faq.replace(/^faq-/, ''))));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const text = query.value.normalize('NFKC').trim().toLowerCase();
    let best = null;
    let score = 0;
    if (text) {
      for (const item of faqs) {
        const value = item.keywords.reduce((sum, word) => sum + (text.includes(word.normalize('NFKC').toLowerCase()) ? word.length : 0), 0);
        if (value > score) { score = value; best = item; }
      }
    }
    showAnswer(best?.id);
  });
})();
