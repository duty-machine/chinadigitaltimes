let Parser = require('rss-parser')
let fs = require('fs')
let querystring = require('querystring')
let emojiRegexp = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/

async function perform() {
  let parser = new Parser()
  let feed = await parser.parseURL('https://chinadigitaltimes.net/chinese/feed/')

  await generateArticles(feed.items)
}

function process(item) {
  let categories = item.categories.filter(c => c.match(emojiRegexp))
  let match = null
  let id = 0
  if (match = item.guid.match(/\?p=(\d+)/)) {
    id = 1000000 - (+match[1])
  }
  return Object.assign(item, {id, categories})
}

function generateArticles(items) {
  let validItems = items.map(item => process(item)).filter(x => x.categories.length > 0).filter(x => x.id != 0)

  validItems.forEach((item) => {
    let md = renderMD(item)
    let filename = `${item.id}_${item.title}.md`
    fs.writeFileSync(`./articles/${filename}`, md)
  })

  generateReadme(validItems)
}

function generateReadme(items) {
  let listItems = items.map(item => `[${item.title}](articles/${item.id}_${querystring.escape(item.title)}.md)\n`)
  let list = listItems.join("\n")
  let md = `${list}`
  fs.writeFileSync(`./README.md`, md)
}

function strip(str) {
  return str.replace(/(^\s*|\s*$)/g, '')
}

function renderMD(item) {
  return `[${item.title}](${item.link})
------
日期：${item.pubDate}

${item['content:encoded'].split("\n").map(line => strip(line)).join('')}
`
}

perform()