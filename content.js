(async function () {
  try {
    // Загружаем sites.json
    const response = await fetch(chrome.runtime.getURL('sites.json'))
    const sites = await response.json()

    // Получаем текущий сайт
    const currentUrl = window.location.origin

    // Проверяем, есть ли сайт в списке
    const site = sites.find(site => currentUrl.includes(new URL(site.url).origin))
    if (site) {
      const playList = await getPlayList(site.handler)
      if (playList) {
        addButton(playList)
      }
    } else {
      console.log('Этот сайт не в списке, расширение не активно.')
    }
  } catch (error) {
    console.error('Ошибка загрузки sites.json:')
  }
})()

function addButton(playList) {
  const button = document.createElement('div')
  button.classList.add('book-download-load-button')
  button.innerHTML = `<button type="button" data-action="book-download-load-play-list">Кнопка</button>`
  document.body.appendChild(button)
  button.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action="book-download-load-play-list"]')
    if(target) {
      loadPlayList(playList)
    }
  })
}


function loadPlayList(playList) {
  if (!Array.isArray(playList) || playList.length === 0) {
    console.warn('⚠️ Плейлист пуст или невалидный.')
    return
  }

  console.log('🔹 Отправка плейлиста в background:', playList)

  chrome.runtime.sendMessage({ action: 'downloadPlaylist', playList }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('❌ Ошибка при отправке:', chrome.runtime.lastError)
    } else {
      console.log('✅ Ответ от background:', response)
    }
  })
}

async function getPlayList(handlerName) {
  return await this[handlerName]()
}

function knigavuheHandler() {
  const scripts = document.querySelectorAll('script')
  for (let script of scripts) {
    if (script.textContent.includes("BookController.enter")) {
      const match = script.textContent.match(/BookController\.enter\((\{.*?\})\);/s)
      if (match) {
        try {
          const bookData = JSON.parse(match[1])
          return bookData.playlist
        } catch (error) {
          console.error('Ошибка парсинга playlist:', error)
        }
      }
    }
  }
}

async function knigoraiHandler() {
  const id = new URL(location.href).pathname.split('/').pop()
  if(!id || isNaN(Number(id))) {
    return
  }
  const url = `https://knigorai.com/books/${id}/playlist.txt`
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Ошибка загрузки: ${response.status} ${response.statusText}`)
    }

    const text = await response.text()
    console.log("📜 Содержимое плейлиста:", text)

    const playList = parsePlaylist(text);
    console.log("🎵 Распарсенный плейлист:", playList)

    return playList;
  } catch (error) {
    console.error("❌ Ошибка загрузки плейлиста:", error)
  }
}