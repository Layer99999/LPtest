document.documentElement.classList.add('js');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#primary-nav');
const closeMenu = () => { nav.classList.remove('is-open'); menuButton.setAttribute('aria-expanded', 'false'); };
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
});
nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('is-open')) { closeMenu(); menuButton.focus(); } });

const helpWidget = document.querySelector('.help-widget');
const helpToggle = document.querySelector('.help-toggle');
const helpPanel = document.querySelector('#help-panel');
const helpClose = document.querySelector('.help-close');
const helpForm = document.querySelector('#help-form');
const helpQuery = document.querySelector('#help-query');
const helpResult = document.querySelector('.help-result');
const helpTopics = [
  ['faq-public', ['公開', 'sns', '実験室', 'アカウント', '事例', '名前']],
  ['faq-data', ['機密', '秘密', '個人情報', 'セキュリティ', '情報管理', '入力', 'データ']],
  ['faq-fees', ['ツール代', '利用料', '別料金', 'クラウド', '追加料金']],
  ['faq-price', ['料金', '価格', '金額', '費用', '見積', '予算', '無料', '月額', 'いくら']],
  ['faq-timeline', ['期間', '納期', '日数', 'いつ', '何日', 'どれくらい']],
  ['faq-human', ['全自動', '自動化', '任せ', '承認', '人間', '自動送信']],
  ['faq-results', ['成果', '効果', '削減', '保証', '品質', '検証']],
  ['faq-team', ['1人', '一人', '少人数', '小規模', 'it担当']],
  ['faq-scope', ['業務', '仕事', '営業', 'アプリ', '動画', '開発', '支援', '制作']],
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
