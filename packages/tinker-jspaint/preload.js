async function renderer() {
  const theme = localStorage.getItem('jspaint theme')
  const language = localStorage.getItem('jspaint language')
  let needReload = false
  if (!theme) {
    localStorage.setItem('jspaint disable seasonal theme', 'true')
    const theme = await tinker.getTheme()
    localStorage.setItem(
      'jspaint theme',
      theme === 'dark' ? 'modern-dark.css' : 'modern.css'
    )
    needReload = true
  }
  if (!language) {
    const lang = await tinker.getLanguage()
    localStorage.setItem(
      'jspaint language',
      lang === 'zh-CN' ? 'zh-simplified' : 'en'
    )
    needReload = true
  }
  if (needReload) {
    location.reload()
  }
}

document.onreadystatechange = () => {
  if (document.readyState === 'interactive') {
    const script = document.createElement('script')
    script.textContent = `(${renderer.toString()})()`
    document.documentElement.appendChild(script)
    document.documentElement.removeChild(script)
  }
}
