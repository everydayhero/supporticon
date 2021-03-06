import lodashGet from 'lodash/get'
import { fetchCurrentUser } from '../../me'
import { get, post, put } from '../../../utils/client'
import { getDistanceTotal, getDurationTotal } from '../../../utils/fitness'
import { required } from '../../../utils/params'

const getPageType = ownerType => {
  switch (ownerType) {
    case 'Team':
      return 'team'
    default:
      return 'individual'
  }
}

export const deserializePage = page => {
  const amountInCents = page.metrics
    ? page.metrics.fundraising.total_in_cents
    : page.amount
      ? page.amount.cents
      : 0

  return {
    active: page.active || page.state === 'active',
    campaign:
      lodashGet(page, 'campaign.name') || page.campaign || page.campaign_name,
    campaignDate: page.campaign_date || page.event_date,
    charity:
      lodashGet(page, 'charity.name') ||
      page.charity ||
      page.beneficiary ||
      page.charity_name,
    coordinates: page.coordinate,
    donationUrl: page.donation_url,
    expired: page.expired,
    fitness: page.metrics
      ? page.metrics.fitness
      : page.fitness_activity_overview,
    fitnessGoal: page.fitness_goal,
    fitnessDistanceTotal: getDistanceTotal(page),
    fitnessDurationTotal: getDurationTotal(page),
    fitnessElevationTotal: page.elevation,
    groups: page.page_groups,
    hasSelfDonated: page.meta && page.meta.self_donated,
    hasUpdatedImage: page.meta && page.meta.has_set_image,
    hasUpdatedStory: page.meta && page.meta.has_set_story,
    id: page.id,
    image: page.image && page.image.extra_large_image_url,
    name: page.name,
    owner: lodashGet(page, 'supporter.name') || page.owner_uid || page.user_id,
    raised: amountInCents / 100,
    segmentation: deserializeSegmentation(page.page_groups),
    slug: page.slug,
    story: page.story,
    target:
      (page.metrics ? page.metrics.fundraising.goal : page.target_cents) / 100,
    teamPageId: page.team_page_id,
    teamRole: page.team_role,
    type: getPageType(page.type || page.owner_type),
    url: page.url,
    uuid: page.uuid
  }
}

const deserializeSegmentation = (groups = []) => {
  if (!Array.isArray(groups)) return {}

  return groups.reduce(
    (segments, group) => ({
      ...segments,
      [group.key]: group.value
    }),
    {}
  )
}

export const fetchPages = (params = required()) => {
  const { allPages, ...finalParams } = params
  const mappings = { type: 'type' }
  const transforms = allPages
    ? {
      ids: v => (Array.isArray(v) ? v.join(',') : v)
    }
    : {
      type: v => (v === 'individual' ? 'user' : v)
    }

  const promise = allPages
    ? get('api/v2/pages', finalParams, { mappings, transforms })
    : get('api/v2/search/pages', finalParams, { mappings, transforms })

  return promise.then(response => response.pages)
}

export const fetchPage = (id = required(), options = {}) => {
  if (typeof id === 'object') {
    const {
      campaignSlug = required(),
      countryCode = required(),
      slug = required()
    } = id

    return get(
      `api/v3/prerelease/pages/${countryCode}/${campaignSlug}/${slug}`
    ).then(response => response.page)
  }

  return get(`api/v2/pages/${id}`)
    .then(response => response.page)
    .then(page =>
      Promise.resolve(options.includeFitness ? fetchElevation(page) : 0).then(
        elevation => ({ ...page, elevation })
      )
    )
}

export const fetchElevation = page => {
  const url = lodashGet(page, 'fitness_activities_totals.href')

  return url
    ? get(url).then(data => lodashGet(data, 'results.0.elevation_in_meters', 0))
    : 0
}

export const fetchUserPages = (params = required()) => {
  const { token = required(), ...otherParams } = params

  return fetchCurrentUser({ token })
    .then(user => user.page_ids)
    .then((ids = []) => {
      if (!ids.length) {
        return null
      }

      const fetchParams = {
        ...otherParams,
        allPages: true,
        ids
      }

      return fetchPages(fetchParams)
    })
}

export const fetchPageDonationCount = (id = required()) => {
  return get(`/api/v2/pages/${id}`).then(data => data.total_donations)
}

export const createPage = ({
  birthday = required(),
  campaignDate,
  campaignId = required(),
  charityId,
  charityOptIn,
  directMarketingConsent,
  expiresAt,
  fitnessGoal,
  giftAid,
  groupValues,
  image,
  inviteToken,
  name,
  nickname,
  redirectTo,
  skipNotification,
  slug,
  story,
  target,
  token = required(),
  user
}) => {
  return post(`/api/v2/pages?access_token=${token}`, {
    birthday,
    campaign_date: campaignDate,
    campaign_id: campaignId,
    charity_id: charityId,
    direct_marketing_consent: directMarketingConsent || charityOptIn,
    expires_at: expiresAt,
    fitness_goal: fitnessGoal,
    gift_aid_eligible: giftAid,
    group_values: groupValues,
    image,
    name,
    nickname,
    redirect_to: redirectTo,
    skip_notification: skipNotification,
    slug,
    story,
    target,
    token: inviteToken,
    uid: user
  }).then(response => response.page)
}

export const updatePage = (
  pageId,
  {
    campaignDate,
    expiresAt,
    fitnessGoal,
    groupValues,
    image,
    name,
    redirectTo,
    slug,
    story,
    target,
    token = required()
  }
) => {
  return put(`/api/v2/pages/${pageId}?access_token=${token}`, {
    campaign_date: campaignDate,
    expires_at: expiresAt,
    fitness_goal: fitnessGoal,
    group_values: groupValues,
    image,
    name,
    redirect_to: redirectTo,
    slug,
    story,
    target
  }).then(response => response.page)
}

export const createPageTag = () =>
  Promise.reject(new Error('This method is not supported for everydayhero'))
