// BizBox Internationalization Module
const translations = {
  ru: {
    nav_products: 'Готовые бизнесы',
    nav_cases: 'Кейсы',
    hero_title: 'Запустите интернет-магазин за 7 дней',
    hero_subtitle: 'От первого заказа до 150k/месяц за 6 месяцев',
    btn_start: 'Начать консультацию',
    btn_consult: 'Консультация',
    stat_clients: 'Клиентов',
    stat_revenue: 'Выручки',
    stat_satisfaction: 'Удовлетворения',
    section_products: 'Готовые бизнесы',
    section_cases: 'Кейсы клиентов',
    section_why: 'Почему BizBox?',
    chat_title: 'AI Советник BizBox',
    cta_title: 'Готовы начать?',
    cta_subtitle: 'Получите персональную консультацию от AI Советника за 2 минуты',
    feature_fast: 'Быстрый запуск',
    feature_fast_desc: 'За 7 дней готовый бизнес',
    feature_ai: 'AI Консультация',
    feature_ai_desc: 'Персональный советник',
    feature_multi: 'Мультиязычность',
    feature_multi_desc: '4 языка + поддержка',
    feature_profit: 'Доход с первого дня',
    feature_profit_desc: 'ROI 300-500%',
    footer_desc: 'Платформа готовых бизнесов с поддержкой AI',
    footer_links: 'Ссылки',
    footer_contact: 'Контакты',
    footer_copyright: '© 2024 BizBox. All rights reserved.'
  },
  uk: {
    nav_products: 'Готові бізнеси',
    nav_cases: 'Кейси',
    hero_title: 'Запустіть інтернет-магазин за 7 днів',
    hero_subtitle: 'Від першого замовлення до 150k/місяць за 6 місяців',
    btn_start: 'Почати консультацію',
    btn_consult: 'Консультація',
    stat_clients: 'Клієнтів',
    stat_revenue: 'Виручки',
    stat_satisfaction: 'Задоволення',
    section_products: 'Готові бізнеси',
    section_cases: 'Кейси клієнтів',
    section_why: 'Чому BizBox?',
    chat_title: 'AI Радник BizBox',
    cta_title: 'Готові почати?',
    cta_subtitle: 'Отримайте персональну консультацію від AI Радника за 2 хвилини',
    feature_fast: 'Швидкий запуск',
    feature_fast_desc: 'За 7 днів готовий бізнес',
    feature_ai: 'AI Консультація',
    feature_ai_desc: 'Персональний радник',
    feature_multi: 'Мультимовність',
    feature_multi_desc: '4 мови + підтримка',
    feature_profit: 'Дохід з першого дня',
    feature_profit_desc: 'ROI 300-500%',
    footer_desc: 'Платформа готових бізнесів з підтримкою AI',
    footer_links: 'Посилання',
    footer_contact: 'Контакти',
    footer_copyright: '© 2024 BizBox. All rights reserved.'
  },
  en: {
    nav_products: 'Ready Businesses',
    nav_cases: 'Cases',
    hero_title: 'Launch Your Store in 7 Days',
    hero_subtitle: 'From First Sale to $150k/month in 6 Months',
    btn_start: 'Get Started',
    btn_consult: 'Consult Now',
    stat_clients: 'Clients',
    stat_revenue: 'Revenue Created',
    stat_satisfaction: 'Satisfaction',
    section_products: 'Ready-Made Businesses',
    section_cases: 'Client Cases',
    section_why: 'Why BizBox?',
    chat_title: 'BizBox AI Advisor',
    cta_title: 'Ready to Start?',
    cta_subtitle: 'Get personalized consultation from AI Advisor in 2 minutes',
    feature_fast: 'Quick Launch',
    feature_fast_desc: 'Ready business in 7 days',
    feature_ai: 'AI Consultation',
    feature_ai_desc: 'Personal advisor',
    feature_multi: 'Multilingual',
    feature_multi_desc: '4 languages + support',
    feature_profit: 'Income from Day 1',
    feature_profit_desc: 'ROI 300-500%',
    footer_desc: 'Ready-made businesses platform with AI support',
    footer_links: 'Links',
    footer_contact: 'Contact',
    footer_copyright: '© 2024 BizBox. All rights reserved.'
  },
  es: {
    nav_products: 'Negocios Listos',
    nav_cases: 'Casos',
    hero_title: 'Lanza tu Tienda en 7 Días',
    hero_subtitle: 'De la Primera Venta a $150k/mes en 6 Meses',
    btn_start: 'Comenzar',
    btn_consult: 'Consultar Ahora',
    stat_clients: 'Clientes',
    stat_revenue: 'Ingresos Creados',
    stat_satisfaction: 'Satisfacción',
    section_products: 'Negocios Listos',
    section_cases: 'Casos de Clientes',
    section_why: '¿Por Qué BizBox?',
    chat_title: 'Asesor AI de BizBox',
    cta_title: '¿Listo para Comenzar?',
    cta_subtitle: 'Obtén consultoría personalizada del Asesor AI en 2 minutos',
    feature_fast: 'Lanzamiento Rápido',
    feature_fast_desc: 'Negocio listo en 7 días',
    feature_ai: 'Consultoría AI',
    feature_ai_desc: 'Asesor personal',
    feature_multi: 'Multilingüe',
    feature_multi_desc: '4 idiomas + soporte',
    feature_profit: 'Ingresos desde el Día 1',
    feature_profit_desc: 'ROI 300-500%',
    footer_desc: 'Plataforma de negocios listos con soporte AI',
    footer_links: 'Enlaces',
    footer_contact: 'Contacto',
    footer_copyright: '© 2024 BizBox. All rights reserved.'
  }
};

let currentLang = localStorage.getItem('lang') || 'ru';

function changeLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.getElementById('lang-select').value = lang;
  updateTranslations();

  // Reload products and cases with new language
  loadProducts();
  loadCases();
}

function updateTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = translations[currentLang][key];
    if (translation) {
      if (el.tagName === 'INPUT') {
        el.placeholder = translation;
      } else {
        el.textContent = translation;
      }
    }
  });
}

function t(key) {
  return translations[currentLang][key] || key;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('lang-select').value = currentLang;
  updateTranslations();
  loadProducts();
  loadCases();
});
