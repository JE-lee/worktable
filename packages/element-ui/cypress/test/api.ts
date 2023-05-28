export function getProducts() {
  return fetch('/api/products.json').then((res) => res.json())
}

function getRegionData() {
  const url = '/api/addr.json'
  return fetch(url).then((res) => res.json())
}

export async function getProvinces() {
  const data = await getRegionData()
  return data.filter((item: any) => {
    return item.province && !item.city && !item.area && !item.town
  })
}

export async function getCities(provinceCode: string) {
  const data = await getRegionData()
  return data.filter((item: any) => {
    return item.province == provinceCode && item.city && !item.area && !item.town
  })
}

export async function getAreas(provinceCode: string, cityCode: string) {
  const data = await getRegionData()
  return data.filter((item: any) => {
    return item.province == provinceCode && item.city == cityCode && item.area && !item.town
  })
}

export async function save(data: Record<string, any>) {
  return fetch('/api/save', { method: 'POST', body: JSON.stringify(data) })
}
