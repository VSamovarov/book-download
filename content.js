(async function () {
  const response = await fetch(chrome.runtime.getURL('sites.json'))
  const sites = await response.json()
  const currentUrl = window.location.origin
  let playlist

  const site = sites.find(site => currentUrl.includes(new URL(site.url).origin))
  if (!site) { return }

  const button = addButton()

  button.addEventListener('click', event => {
    const target = event.target.closest('button[data-action="download-play-list-button"]')
    if (target) {
      const messageWrapper = event.target.parentElement.querySelector('.download-play-list-message')
      try {
        console.log(playlist)
        downloadPlaylist(playlist)
      } catch (e) {
        messageWrapper.innerHTML = e.message
      }
    }
  })

  await initPlayList()

  chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    try {
      if (message.action === 'historyChanged') {
        await initPlayList()
        sendResponse({ status: 'ok' }) // Отправляем ответ после завершения
      }
    } catch (error) {
      console.error("Ошибка в обработчике сообщений content.js:", error)
      sendResponse({ status: 'error', message: error.message })
    }
    return true
  })


  async function initPlayList() {
    playlist = await getPlayList(site.handler)
    button.querySelector('button').disabled = !playlist;
  }

  async function getPlayList (handlerName) {
    const handlers = window.SamBookDownload.handlers
    if (!handlers[handlerName]) {
      throw new Error(`❌ Unknown handler: ${handlerName}`)
    }
    return await handlers[handlerName]()
  }

  function addButton () {
    const buttonContainer = document.createElement('div')
    buttonContainer.classList.add('download-play-list-button-wrapper')
    buttonContainer.innerHTML = `<button type="button" disabled data-action="download-play-list-button">Завантажити книжку</button>`
    const messageWrapper = document.createElement('div')
    messageWrapper.classList.add('download-play-list-message')
    buttonContainer.appendChild(messageWrapper)
    document.body.appendChild(buttonContainer)
    return buttonContainer
  }

  function downloadPlaylist({ playlist, title }) {
    if (!Array.isArray(playlist) || playlist.length === 0) {
      throw new Error(`Playlist is empty or invalid`)
    }
    chrome.runtime.sendMessage({ action: "downloadPlaylist", playlist, title }, response => {
      if (chrome.runtime.lastError) {
        console.error(`❌ Ошибка при отправке сообщения:`, chrome.runtime.lastError.message)
        throw new Error(`Ошибка при при загрузке`)
      } else {
        console.log(`✅ Сообщение отправлено успешно:`, response)
      }
    })
  }
})()
