import { get } from '../../../utils/client'
import compact from 'lodash/compact'

export const fetchDonationFeed = options => {
  const { includeOffline, fetchAll, ...params } = options

  const finalParams = {
    ...params,
    type: compact(['OnlineDonation', includeOffline && 'OfflineDonation'])
  }

  return fetchAll
    ? recursivelyFetchFeed(finalParams)
    : fetchFeed(finalParams).then(({ results }) => results)
}

const fetchFeed = params => {
  const mappings = {
    campaign: 'campaign_id',
    charity: 'charity_id',
    page: 'page_id',
    team: 'team_id',
    type: 'type',
    index: 'page'
  }

  return get('api/v2/search/feed', params, { mappings })
}

const recursivelyFetchFeed = (params, feed = [], index = 1) =>
  fetchFeed({ ...params, index }).then(({ results, meta: { pagination } }) => {
    const updatedResults = [...feed, ...results]

    return pagination.last_page || index >= 50
      ? updatedResults
      : recursivelyFetchFeed(params, updatedResults, index + 1)
  })

export const deserializeDonation = donation => ({
  amount: donation.amount.cents / 100,
  anonymous: donation.anonymous,
  createdAt: donation.created_at,
  currency: donation.amount.currency.iso_code,
  message: donation.message,
  name: donation.nickname,
  page: donation.page_id,
  reply: donation.thankyou_message
})
