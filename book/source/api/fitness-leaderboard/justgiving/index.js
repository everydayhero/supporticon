import chunk from 'lodash/chunk'
import flattenDeep from 'lodash/flattenDeep'
import get from 'lodash/get'
import * as client from '../../../utils/client'
import { paramsSerializer, required } from '../../../utils/params'
import { baseUrl, imageUrl } from '../../../utils/justgiving'

const fetchActivePages = pages => {
  const pageGuids = pages.map(page => page.ID).filter(Boolean)

  if (!pageGuids.length) {
    return pages
  }

  return Promise.all(
    chunk(pageGuids, 20).map(guids =>
      client.servicesAPI
        .get('/v1/justgiving/proxy/fundraising/v2/pages/bulk', {
          params: { pageGuids: guids.join(',') }
        })
        .then(response => response.data.results)
    )
  )
    .then(results => flattenDeep(results))
    .then(results => results.filter(page => page.status === 'Active'))
    .then(results => results.map(page => page.pageGuid))
    .then(activePageIds =>
      pages.filter(page => activePageIds.indexOf(page.ID) > -1)
    )
}

export const fetchFitnessLeaderboard = ({
  campaign = required(),
  activeOnly,
  type,
  limit,
  offset,
  startDate,
  endDate
}) => {
  const query = {
    campaignGuid: campaign,
    limit: limit || 100,
    offset: offset || 0,
    start: startDate,
    end: endDate
  }

  return client
    .get('/v1/fitness/campaign', query, {}, { paramsSerializer })
    .then(result => (type === 'team' ? result.teams : result.pages))
    .then(
      items => (activeOnly && type !== 'team' ? fetchActivePages(items) : items)
    )
    .then(items => items.filter(item => item.Details))
    .then(items => items.map(item => ({ ...item, type: type || 'individual' })))
}

export const deserializeFitnessLeaderboard = (item, index) => ({
  position: index + 1,
  id: item.ID,
  name: get(item, 'Details.Name'),
  slug: get(item, 'Details.Url'),
  url: [
    baseUrl(),
    item.type === 'team' ? 'team' : 'fundraising',
    get(item, 'Details.Url')
  ].join('/'),
  image:
    imageUrl(get(item, 'Details.ImageId'), 'Size186x186Crop') ||
    'https://assets.blackbaud-sites.com/images/supporticon/user.svg',
  distance: item.TotalValue
})