chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action !== "downloadPlaylist" || !Array.isArray(message.playList)) {
    return;
  }

  const MAX_CONCURRENT_DOWNLOADS = 3; // Максимальное количество одновременных загрузок
  let activeDownloads = 0;
  const queue = [...message.playList];

  const processNext = () => {
    if (queue.length === 0 && activeDownloads === 0) {
      console.log("✅ Все загрузки завершены.");
      sendResponse({ status: "ok" });
      return;
    }

    while (activeDownloads < MAX_CONCURRENT_DOWNLOADS && queue.length > 0) {
      const track = queue.shift();
      if (!track.url || !track.title) {
        console.warn("⚠️ Пропущен некорректный трек:", track);
        continue;
      }

      activeDownloads++;
      const fileName = sanitizeFileName(`${track.title}.mp3`);

      chrome.downloads.download(
        {
          url: track.url,
          filename: `AudioBooks/${fileName}`,
          conflictAction: "uniquify",
          saveAs: false
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error(`❌ Ошибка загрузки ${fileName}:`, chrome.runtime.lastError);
          } else {
            console.log(`📥 Загружается: ${fileName} (ID: ${downloadId})`);
          }

          activeDownloads--;
          processNext(); // Запускаем следующую загрузку
        }
      );
    }
  };

  processNext(); // Запускаем первую волну загрузок
});

function sanitizeFileName(name) {
  return name.replace(/[<>:"/\\|?*]+/g, "_").trim();
}
