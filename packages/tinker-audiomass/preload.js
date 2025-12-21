document.addEventListener('DOMContentLoaded', () => {
  const head = document.head
  const style = document.createElement('style')
  style.textContent = `
    html.dark { color-scheme: dark; }
    html, body {
      overflow: hidden;
    }
  `
  head.appendChild(style)
})
