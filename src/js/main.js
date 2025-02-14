import SwitchTabs from './modules/SwtichTabs';
import loadSwiper from './modules/swiper';

document.addEventListener('DOMContentLoaded', () => {
  const tabsContent = document.querySelector('.tabs-content');
  const tabsList = document.querySelector('#tabs-list');

  // Инициализация переключения табов
  const switchTabs = new SwitchTabs('tabs', { tabsList, tabsContent });

  loadSwiper('related-products-swiper');
});
