window.SamBookDownload = window.SamBookDownload || {}

window.SamBookDownload.handlers = {}

const handlers = window.SamBookDownload.handlers


handlers.knigavuhe = async function() {
  let playlist
  const url = new URL(location.href)
  url.searchParams.set('ajn', '1')
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Loading error: ${response.status} ${response.statusText}`)
  const data = await response.json()
  const script = data?.[1]?.js?.[0]

  if(!script) return
  let regx
  if (script.includes('BookController.enter')) {
    regx = /BookController\.enter\((\{.*?\})\);/s
  } else if(script.includes('new BookPlayer')) {
    regx = /BookPlayer\(\s*\d+\s*,\s*(\[[^\]]*\])/
  }
  const match = script.match(regx)
  if (match) {
    const bookData = JSON.parse(match[1])
    playlist = (bookData.playlist || bookData)
      .map((item, index) => ({ index,  title: item.title, url: item.url }))
  }
  if (playlist) {
    return {
      playlist,
      title: data?.[1]?.title || 'knigavuhe'
    }
  }
}

handlers.knigorai = async function () {
  const id = new URL(location.href).pathname.split('/').pop()
  if (!id || isNaN(Number(id))) {
    return
  }
  const url = `https://knigorai.com/books/${id}/playlist.txt`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Loading error: ${response.status} ${response.statusText}`)
  const text = await response.text()
  const data = JSON.parse(text)
  const playlist = data.map((item, index) => ({ index,  title: item.title, url: item.file }))
  const title = document.querySelector('.book-title h1')

  if(playlist) {
    return {
      playlist,
      title: title?.innerText || ('knigorai-' + new Date().getTime())
    }
  }
}
