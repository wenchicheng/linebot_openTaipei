import axios from 'axios'
import nearTemplate from '../templates/near.js'
import { distance } from '../utils/distance.js'

export default async (event) => {
  try {
    const { data } = await axios.get('https://cloud.culture.tw/frontsite/opendata/emapOpenDataJsonAction.do?method=exportEmapJsonNearBy&lat=25.051345&lon=121.549569&range=10')

    const replies = data
      .map(value => {
        // .map 解析資料
        value.distance = distance(event.message.latitude, event.message.longitude, value.latitude, value.longitude, 'K')
        // event.message 當前位置資料 ， 存在 distance 中
        return value
      })
      .filter(value => {
        return value.distance <= 3
        // 過濾距離小於等於3的數據
      })
      .sort((a, b) => {
        // 對數據按照距離進行排序，a 小於 b，這導致 a 在排序後的結果中排在 b 之前。
        return a.distance - b.distance
      })
      .slice(0, 5).map(value => {
        // 最多五筆資料
        const template = nearTemplate()
        template.hero.url = value.representImage?.replace('http://', 'https://') || '../images/暫無圖片.jpg'
        template.body.contents[0].text = value.name
        template.body.contents[1].contents[0].contents[1].text = value.author || '未詳'
        // 確保每筆資料都有"author" 欄位，如果沒有則會顯示'未詳'

        template.body.contents[1].contents[1].contents[1].text = value.material || '未詳'
        template.body.contents[1].contents[2].contents[1].text = value.address || '未詳'

        const navigationUri = `https://www.google.com/maps/dir/?api=1&destination=${encodeURI(value.address)}`
        template.footer.contents[0].action.uri = navigationUri
        /*
        encodeURI() 中文轉換編碼的語法
        decodeURI() 編碼的語法轉成中文
        template.quickReply.items[0].action.uri = encodeURI('https://www.google.com/maps/search/地址')
        使用 encodeURI 將地點套用到 Google 地圖導航的 URI
        */

        return template
      })

    const result = await event.reply(replies.length === 0
      ? '附近找不到，換個地點試試看？'
      : {
          type: 'flex',
          altText: '查詢結果',
          contents: {
            type: 'carousel',
            contents: replies
          }
        })
    console.log(result)
  } catch (error) {
    console.log(error)
  }
}
