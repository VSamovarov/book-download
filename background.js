chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "downloadPlaylist" && Array.isArray(message.playList)) {
    let delay = 0;

    for (const track of message.playList) {
      if (!track.url || !track.title) {
        console.warn("⚠️ Пропущен некорректный трек:", track);
        continue;
      }

      const fileName = sanitizeFileName(`${track.title}.mp3`);

      setTimeout(() => {
        chrome.downloads.download({
          url: track.url,
          filename: `AudioBooks/${fileName}`,
          conflictAction: 'uniquify',
          saveAs: false
        }, (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error(`❌ Ошибка загрузки ${fileName}:`, chrome.runtime.lastError);
          } else {
            console.log(`📥 Загружается: ${fileName} (ID: ${downloadId})`);
          }
        });
      }, delay);

      delay += 1000;
    }

    sendResponse({ status: "ok" });
  }
});

function sanitizeFileName(name) {
  return name.replace(/[<>:"/\\|?*]+/g, "_").trim();
}
