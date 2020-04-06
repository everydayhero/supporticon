import { get, servicesAPI } from '../../../utils/client'
import {
  getUID,
  required,
  dataSource,
  paramsSerializer
} from '../../../utils/params'
import { currencyCode } from '../../../utils/currencies'

const fetchEvent = id =>
  get(`v1/event/${id}/pages`).then(response => response.totalFundraisingPages)

const fetchCampaign = id =>
  servicesAPI
    .get(`/v1/justgiving/campaigns/${id}/leaderboard`)
    .then(({ data }) => data.meta.totalResults)

export const fetchPagesTotals = (params = required()) => {
  switch (dataSource(params)) {
    case 'event':
      const eventIds = Array.isArray(params.event)
        ? params.event
        : [params.event]

      return Promise.all(eventIds.map(getUID).map(fetchEvent)).then(events =>
        events.reduce((acc, total) => acc + total, 0)
      )
    case 'campaign':
      const campaignIds = Array.isArray(params.campaign)
        ? params.campaign
        : [params.campaign]

      return Promise.all(campaignIds.map(getUID).map(fetchCampaign)).then(
        campaigns => campaigns.reduce((acc, total) => acc + total, 0)
      )
    default:
      return get(
        'donationsleaderboards/v1/leaderboard',
        {
          ...params,
          currencyCode: currencyCode(params.country)
        },
        {
          mappings: {
            charity: 'charityIds',
            campaign: 'campaignGuids',
            page: 'pageGuids',
            excludePageIds: 'excludePageGuids',
            limit: 'take'
          }
        },
        { paramsSerializer }
      ).then(data => data.totalResults)
  }
}
