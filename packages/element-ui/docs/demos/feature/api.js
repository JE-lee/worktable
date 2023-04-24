function getRegionData() {
  const url = 'https://unpkg.com/province-city-china@8.5.6/dist/data.json'
  return fetch(url).then((res) => res.json())
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getProvinces() {
  const data = await getRegionData()
  await delay(200)
  return data.filter((item) => {
    return item.province && !item.city && !item.area && !item.town
  })
}

export async function getCities(provinceCode) {
  const data = await getRegionData()
  await delay(200)
  return data.filter((item) => {
    return item.province == provinceCode && item.city && !item.area && !item.town
  })
}

export async function getAreas(provinceCode, cityCode) {
  const data = await getRegionData()
  await delay(200)
  return data.filter((item) => {
    return item.province == provinceCode && item.city == cityCode && item.area && !item.town
  })
}
