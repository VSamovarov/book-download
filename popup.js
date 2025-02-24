document.addEventListener('DOMContentLoaded', async () => {
  const siteListWrapper = document.getElementById('site-list-wrapper')

  try {
    // Загружаем JSON-файл
    const response = await fetch(chrome.runtime.getURL('sites.json'))
    const sites = await response.json();

    // Создаём список
    const siteList = document.createElement('ul')
    sites.forEach(site => {
      const item = document.createElement('li')
      item.innerHTML = `<a href="${site.url}" target="_blank">${site.name}</a>`
      siteList.appendChild(item)
    });

    // Добавляем список в popup
    siteListWrapper.appendChild(siteList)
  } catch (error) {
    console.error('Ошибка загрузки списка сайтов:', error)
  }
});