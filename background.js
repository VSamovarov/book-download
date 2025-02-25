// Для отслеживания изменений на одностраничниках
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  chrome.tabs.sendMessage(details.tabId, { action: 'historyChanged' }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn("❌ Ошибка при отправке сообщения:", chrome.runtime.lastError.message)
    } else {
      console.log("✅ Ответ от content.js:", response)
    }
  })
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  const { action, playlist, title } = message

  if (action !== "downloadPlaylist" || !Array.isArray(playlist)) {
    return
  }

  const MAX_CONCURRENT_DOWNLOADS = 3
  let activeDownloads = 0
  let responseSent = false // ✅ Флаг для предотвращения двойного вызова sendResponse


  const bookName = sanitizeFileName(title)
  const queue = [...playlist]

  const processNext = () => {
    if (queue.length === 0 && activeDownloads === 0) {
      console.log('✅ Все загрузки завершены.')
      if (!responseSent) {
        sendResponse({ status: 'ok' })
        responseSent = true;
      }
      return;
    }

    while (activeDownloads < MAX_CONCURRENT_DOWNLOADS && queue.length > 0) {
      const track = queue.shift()
      if (!track.url || !track.title) {
        console.warn('⚠️ Пропущен некорректный трек:', track)
        continue;
      }

      activeDownloads++;
      const fileName = (track.index.toString()).padStart(4, '0') + '.mp3'

      chrome.downloads.download(
        {
          url: track.url,
          filename: `AudioBooks/${bookName}/${fileName}`,
          conflictAction: 'uniquify',
          saveAs: false
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error(`❌ Ошибка загрузки ${fileName}:`, chrome.runtime.lastError)
          } else {
            console.log(`📥 Загружается: ${fileName} (ID: ${downloadId})`)
          }
          activeDownloads--
          processNext()
        }
      )
    }
  }

  processNext()
  return true
})

function sanitizeFileName(name) {
  return name.replace(/[<>:"/\\|?*]+/g, "_").trim()
}
