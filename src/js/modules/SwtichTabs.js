export default class SwitchTabs {
  constructor(tabsContainer, { tabsList, tabsContent }) {
    this.tabsContainer = document.querySelector(`#${tabsContainer}`);
    this.tabList = tabsList;
    this.tabsContent = tabsContent;
    this.tabsBtns = [...this.tabsContainer.querySelectorAll('.tab__btn')];
    this.newIndex = null;

    if (!this.tabsContainer || !this.tabsContent || !this.tabList) {
      alert('Не найдены необходимые элементы для инициализации SwitchTabs.');
      throw new Error('Не найдены необходимые элементы для инициализации SwitchTabs');
    }

    // Инициализация
    this.init();
  }

  // Метод инициализации
  init = () => {
    // Переключение табов
    this.tabList.addEventListener('click', (event) => {
      const target = event.target.closest('.tab__btn');

      if (target) {
        this.switchTab(target);
      }
    });

    // Обработчик клавиш "вперед" и "назад"
    document.addEventListener('keydown', (event) => {
      const currentIndex = Number(this.tabList.querySelector('.active').id.slice(-1)) - 1;

      switch (event.key) {
        case 'ArrowRight':
          this.newIndex = (currentIndex + 1) % this.tabsBtns.length;
          this.switchTab(this.tabsBtns[this.newIndex]);
          break;
        case 'ArrowLeft':
          this.newIndex = Math.abs(currentIndex - 1 + this.tabsBtns.length) % this.tabsBtns.length;
          this.switchTab(this.tabsBtns[this.newIndex]);
          break;
        case 'Enter' || event.key === ' ':
          event.preventDefault();
          this.switchTab(event.target);
          break;
      }
    });
  };

  // Метод переключения аттрибутов
  switchAttributes = (el, isActive) => {
    el.classList.toggle('active', isActive);
    el.setAttribute('aria-selected', isActive);
    el.tabIndex = isActive ? 0 : -1;
  };

  // Метод переключения табов
  switchTab = (tab) => {
    if (tab.classList.contains('active')) return;

    const tabPanelID = tab.getAttribute('aria-controls');
    const tabPanel = this.tabsContent.querySelector(`#${tabPanelID}`);

    if (!tabPanel) return;

    this.tabsBtns.forEach((btn) => this.switchAttributes(btn, false));
    [...this.tabsContent.children].forEach((panel) => panel.classList.remove('active'));

    this.switchAttributes(tab, true);
    tabPanel.classList.add('active');

    tab.focus();
  };
}
