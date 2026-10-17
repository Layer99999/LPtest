document.documentElement.classList.add('js');
// Menu bar: keep jump targets clear of the sticky header and mark the section in view.
const header = document.querySelector('.site-header');
const menuList = document.querySelector('.menubar-list');
const menuLinks = [...menuList.querySelectorAll('a[href^="#"]')];
const menuSections = menuLinks.map(link => document.querySelector(link.getAttribute('href')));
const setHeaderHeight = () => document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
let currentLink = null;
const markCurrent = () => {
  const line = header.offsetHeight + 80;
  let index = -1;
  menuSections.forEach((section, i) => { if (section && section.getBoundingClientRect().top <= line) index = i; });
  const link = menuLinks[index] || null;
  if (link === currentLink) return;
  if (!link) menuList.scrollTo({ left: 0 });
  currentLink?.classList.remove('is-current');
  link?.classList.add('is-current');
  currentLink = link;
  if (link && menuList.scrollWidth > menuList.clientWidth) {
    const left = link.offsetLeft - menuList.offsetLeft;
    if (left < menuList.scrollLeft || left + link.offsetWidth > menuList.scrollLeft + menuList.clientWidth) menuList.scrollTo({ left: Math.max(0, left - 16), behavior: 'smooth' });
  }
};
setHeaderHeight();
markCurrent();

// Proof band: copy the cards once (hidden from assistive tech) so the loop is seamless; tap or focus pauses it.
const proofTrack = document.querySelector('.proof-track');
const proofMarquee = document.querySelector('.proof-marquee');
if (proofTrack && proofMarquee) {
  [...proofTrack.children].forEach(item => {
    const copy = item.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    proofTrack.append(copy);
  });
  proofMarquee.addEventListener('click', () => proofMarquee.classList.toggle('is-paused'));
}

// Mobile bar: hide while the hero's own buttons are on screen so the two never overlap.
const stickyCta = document.querySelector('.sticky-cta');
const heroActions = document.querySelector('.hero2-actions');
if (stickyCta && heroActions && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => stickyCta.classList.toggle('is-hidden', entry.isIntersecting)).observe(heroActions);
}
window.addEventListener('resize', () => { setHeaderHeight(); markCurrent(); });
window.addEventListener('scroll', markCurrent, { passive: true });

const helpWidget = document.querySelector('.help-widget');
const helpToggle = document.querySelector('.help-toggle');
const helpPanel = document.querySelector('#help-panel');
const helpClose = document.querySelector('.help-close');
const helpForm = document.querySelector('#help-form');
const helpQuery = document.querySelector('#help-query');
const helpResult = document.querySelector('.help-result');
const helpTopics = [
  ['faq-custom', ['カスタマイズ', 'オーダーメイド', '自社向け', '専用', '研修', '講義', '講習', 'ワークショップ', '動画']],
  ['faq-public', ['公開', 'sns', '実験室', 'アカウント', '事例', '名前']],
  ['faq-data', ['機密', '秘密', '個人情報', 'セキュリティ', '情報管理', '入力', 'データ']],
  ['faq-fees', ['ツール代', '利用料', '別料金', 'クラウド', '追加料金']],
  ['faq-price', ['料金', '価格', '金額', '費用', '見積', '予算', '無料', '月額', 'いくら']],
  ['faq-timeline', ['期間', '納期', '日数', 'いつ', '何日', 'どれくらい', '時間', '3か月', '三か月', '何回']],
  ['faq-results', ['成果', '効果', '削減', '保証', '品質', '検証']],
  ['faq-team', ['1人', '一人', '少人数', '小規模', 'it担当', 'パソコン', '苦手', '現場', '初心者']],
  ['faq-scope', ['業務', '仕事', '営業', 'アプリ', '動画', '開発', '支援', '制作', '医療', '病院', 'クリニック', 'シフト', '経営分析', '研修', 'フリーランス', '個人事業', 'lp', 'ホームページ', 'youtube', '運用代行']],
  ['faq-start', ['未定', '決まって', '初めて', '相談', '何から']],
];
const closeHelp = (restoreFocus = false) => {
  helpPanel.hidden = true;
  helpToggle.setAttribute('aria-expanded', 'false');
  if (restoreFocus) helpToggle.focus();
};
const showAnswer = id => {
  helpResult.replaceChildren();
  const faq = document.getElementById(id);
  if (!faq) {
    const message = document.createElement('p');
    message.textContent = '該当する質問が見つかりませんでした。「料金」「期間」など、短いキーワードでお試しください。';
    const contact = document.createElement('a');
    contact.href = '#contact'; contact.textContent = '個別に相談する';
    contact.addEventListener('click', () => closeHelp());
    helpResult.append(message, contact);
    return;
  }
  const title = document.createElement('h3');
  title.textContent = faq.querySelector('summary').textContent;
  const answer = document.createElement('p');
  answer.textContent = faq.querySelector('p').textContent;
  const link = document.createElement('a');
  link.href = '#' + id; link.textContent = 'よくある質問で読む';
  link.addEventListener('click', () => {
    faq.open = true; closeHelp();
    faq.querySelector('summary').focus({ preventScroll: true });
  });
  helpResult.append(title, answer, link);
};
helpToggle.addEventListener('click', () => {
  const open = helpPanel.hidden;
  helpPanel.hidden = !open;
  helpToggle.setAttribute('aria-expanded', String(open));
  if (open) helpClose.focus();
});
helpClose.addEventListener('click', () => closeHelp(true));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !helpPanel.hidden) closeHelp(true); });
document.addEventListener('click', event => { if (!helpWidget.contains(event.target)) closeHelp(); });
document.querySelectorAll('[data-faq]').forEach(button => button.addEventListener('click', () => showAnswer(button.dataset.faq)));
helpForm.addEventListener('submit', event => {
  event.preventDefault();
  const query = helpQuery.value.normalize('NFKC').trim().toLowerCase();
  const match = query ? helpTopics.find(([, keywords]) => keywords.some(word => query.includes(word))) : undefined;
  showAnswer(match?.[0]);
});
helpWidget.hidden = false;

// Preserve the existing production measurement. Local previews never load analytics.
if (['tigerlabo.com', 'www.tigerlabo.com'].includes(window.location.hostname)) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', 'G-8K4H98JX4Q', { allow_google_signals: false, allow_ad_personalization_signals: false, allow_enhanced_conversions: false });
  const analytics = document.createElement('script');
  analytics.async = true;
  analytics.src = 'https://www.googletagmanager.com/gtag/js?id=G-8K4H98JX4Q';
  document.head.append(analytics);
}
