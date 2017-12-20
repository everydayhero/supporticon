import { get } from '../../../utils/client'
import { required } from '../../../utils/params'
import compact from 'lodash/compact'
import orderBy from 'lodash/orderBy'
import range from 'lodash/range'

const currencySymbol = (code = 'GBP') => {
  switch (code) {
    case 'GBP':
      return '£'
    case 'HKD':
      return 'HK$'
    case 'AED':
      return 'د.إ'
    default:
      return '$'
  }
}

/**
* @function fetches fundraising pages ranked by funds raised
*/
export const fetchLeaderboard = (params = required()) => {
  const { campaign, charity, event } = params

  if (event) {
    if (isNaN(event)) {
      throw new Error('Event parameter must be an ID')
    }

    return get(`/v1/event/${event}/leaderboard`).then((response) => (
      response.pages.map((page) => ({
        ...page,
        raisedAmount: page.amount,
        eventName: response.eventName,
        currencyCode: response.currency,
        currencySymbol: currencySymbol(response.currency)
      }))
    ))
  } else if (charity && !campaign) {
    if (isNaN(charity)) {
      throw new Error('Charity parameter must be an ID')
    }

    return get(`/v1/charity/${charity}/leaderboard`).then((response) => (
      response.pages.map((page) => ({
        ...page,
        raisedAmount: page.amount,
        eventName: response.name,
        currencyCode: response.currency,
        currencySymbol: response.currencySymbol
      }))
    ))
  } else {
    if (!charity || !campaign) {
      return required()
    }

    const url = `/v1/campaigns/${charity}/${campaign}/pages`
    const pageSize = 100
    const pageLimit = 10
    const sort = (pages) => orderBy(pages, 'raisedAmount', 'desc')

    return get(url, { pageSize, page: 1 }).then(({ totalPages, fundraisingPages }) => {
      if (totalPages > 1) {
        const upperLimit = Math.min(totalPages, pageLimit)
        const paginatedRequests = range(2, upperLimit + 1).map((page) => {
          return get(url, { pageSize, page: page })
        })

        return Promise.all(paginatedRequests)
        .then((responses) => {
          const paginatedResults = compact(responses.map((res) => res.fundraisingPages))
          return sort(fundraisingPages.concat(paginatedResults))
        })
      }

      return sort(fundraisingPages)
    })
  }
}

/**
* @function a default deserializer for leaderboard pages
*/
export const deserializeLeaderboard = (supporter, index) => ({
  position: index + 1,
  id: supporter.pageId,
  name: supporter.pageTitle,
  subtitle: supporter.eventName,
  url: `https://www.justgiving.com/${supporter.pageShortName}`,
  image: supporter.defaultImage || `https://images.jg-cdn.com/image/${supporter.pageImages[0]}?template=Size200x200`,
  raised: supporter.raisedAmount,
  target: supporter.targetAmount,
  currency: supporter.currencyCode,
  currencySymbol: supporter.currencySymbol
})
