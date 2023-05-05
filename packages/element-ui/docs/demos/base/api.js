function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function getProducts() {
  await delay(500)
  return fetch('/products.json').then((res) => res.json())
}

async function getRegionData() {
  const url = '/addr.json'
  await delay(500)
  return fetch(url).then((res) => res.json())
}

export async function getProvinces() {
  const data = await getRegionData()
  return data.filter((item) => {
    return item.province && !item.city && !item.area && !item.town
  })
}

export async function getCities(provinceCode) {
  const data = await getRegionData()
  return data.filter((item) => {
    return item.province == provinceCode && item.city && !item.area && !item.town
  })
}

export async function getAreas(provinceCode, cityCode) {
  const data = await getRegionData()
  return data.filter((item) => {
    return item.province == provinceCode && item.city == cityCode && item.area && !item.town
  })
}

export async function save(data) {
  return fetch('/save', { method: 'POST', body: JSON.stringify(data) })
}
