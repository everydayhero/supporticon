import { get, servicesAPI } from '../../../utils/client'
import { getUID, required, dataSource } from '../../../utils/params'
import { currencySymbol, currencyCode } from '../../../utils/currencies'

/**
 * @function fetches fundraising pages ranked by funds raised
 */
export const fetchLeaderboard = (params = required()) => {
  switch (dataSource(params)) {
    case 'event':
      return get(`/v1/event/${getUID(params.event)}/leaderboard`, {
        currency: currencyCode(params.country)
      }).then(response =>
        response.pages.map(page => ({
          ...page,
          raisedAmount: page.amount,
          eventName: response.eventName,
          currencyCode: response.currency,
          currencySymbol: currencySymbol(response.currency)
        }))
      )
    case 'charity':
      return get(`/v1/charity/${getUID(params.charity)}/leaderboard`, {
        currency: currencyCode(params.country)
      }).then(response =>
        response.pages.map(page => ({
          ...page,
          raisedAmount: page.amount,
          eventName: response.name,
          currencyCode: response.currency,
          currencySymbol: response.currencySymbol
        }))
      )
    default:
      return recursivelyFetchJGLeaderboard(
        getUID(params.campaign),
        params.q,
        params.limit
      )
  }
}

const recursivelyFetchJGLeaderboard = (
  campaign,
  q,
  limit = 10,
  results = [],
  page = 1
) => {
  const options = {
    params: { page, q }
  }

  return servicesAPI
    .get(`/v1/justgiving/campaigns/${campaign}/leaderboard`, options)
    .then(response => response.data)
    .then(data => {
      const { currentPage, totalPages } = data.meta
      const updatedResults = [...results, ...data.results]

      if (currentPage === totalPages || page * 10 >= limit) {
        return updatedResults
      } else {
        return recursivelyFetchJGLeaderboard(
          campaign,
          q,
          limit,
          updatedResults,
          page + 1
        )
      }
    })
}

/**
 * @function a default deserializer for leaderboard pages
 */
export const deserializeLeaderboard = (supporter, index) => ({
  currency: supporter.currencyCode,
  currencySymbol: supporter.currencySymbol,
  donationUrl: `https://www.justgiving.com/fundraising/${
    supporter.pageShortName
  }/donate`,
  id: supporter.pageId,
  image:
    supporter.defaultImage ||
    (supporter.pageImages
      ? `https://images.jg-cdn.com/image/${
        supporter.pageImages[0]
      }?template=Size200x200`
      : supporter.pageOwner
        ? `https://www.justgiving.com/fundraising/images/user-profile/${
          supporter.pageOwner.accountId
        }`
        : null),
  name:
    supporter.pageTitle ||
    (supporter.pageOwner && supporter.pageOwner.fullName),
  position: index + 1,
  raised: parseFloat(
    supporter.amount || supporter.raisedAmount || supporter.amountRaised || 0
  ),
  slug: supporter.pageShortName,
  subtitle: supporter.eventName,
  target: supporter.targetAmount || supporter.target,
  totalDonations: supporter.numberOfSupporters,
  url: `https://www.justgiving.com/${supporter.pageShortName}`
})
