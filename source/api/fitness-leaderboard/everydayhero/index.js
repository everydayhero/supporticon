import last from 'lodash/last'
import { get } from '../../../utils/client'
import { required } from '../../../utils/params'

export const c = {
  ENDPOINT: 'api/v2/search/fitness_activities_totals'
}

/**
 * @function fetches supporter pages ranked by fitness activities
 */
export const fetchFitnessLeaderboard = (params = required()) => {
  const transforms = {
    type: val =>
      val === 'team' ? 'teams' : val === 'group' ? 'groups' : 'individuals',

    sortBy: val => {
      switch (val) {
        case 'calories':
          return 'calories'
        case 'duration':
          return 'duration_in_seconds'
        case 'elevation':
          return 'elevation_in_meters'
        default:
          return 'distance_in_meters'
      }
    }
  }

  const mappings = {
    activity: 'type',
    groupID: 'group_id',
    type: 'group_by',
    sortBy: 'sort_by'
  }

  return get(c.ENDPOINT, params, { mappings, transforms }).then(
    response => response.results
  )
}

/**
 * @function a default deserializer for leaderboard pages
 */
export const deserializeFitnessLeaderboard = (result, index) => {
  if (result.page) {
    return deserializePage(result.page, result, index)
  } else if (result.team) {
    return deserializePage(result.team, result, index)
  } else if (result.group) {
    return deserializeGroup(result, index)
  }
}

const deserializePage = (item, result, index) => ({
  calories: result.calories,
  charity: item.charity_name,
  charityLogo: item.charity_logo_url,
  distance: result.distance_in_meters,
  donationUrl: item.donation_url,
  duration: result.duration_in_seconds,
  elevation: result.elevation_in_meters,
  groups: item.group_values,
  id: item.id,
  image: item.image.medium_image_url,
  name: item.name,
  position: index + 1,
  raised: item.amount.cents,
  slug: item.url && last(item.url.split('/')),
  subtitle: item.charity_name,
  url: item.url
})

const deserializeGroup = (item, index) => ({
  calories: item.calories,
  count: item.count,
  distance: item.distance_in_meters,
  duration: item.duration_in_seconds,
  elevation: item.elevation_in_meters,
  id: item.group.id,
  name: item.group.value,
  position: index + 1,
  raised: item.amount_cents / 100
})
